'use client';

import {
    ComponentProps,
    createContext,
    MouseEvent,
    ReactNode,
    RefObject,
    useContext,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cva, VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import { lockPage, tabbables, useIsClient } from './layer';
import { Slot } from './Slot';

// Dialog (centred) and Sheet (slides in from an edge) share a native modal <dialog> underneath: the browser keeps
// focus inside it and makes the page behind inert. Same API as the Radix Dialog it replaced.

type DialogContextValue = { open: boolean; setOpen: (open: boolean) => void; titleId: string; descriptionId: string };

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
    const dialog = useContext(DialogContext);
    if (!dialog) throw new Error('Dialog parts must be inside <Dialog>');
    return dialog;
}

export function Dialog({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    children,
}: {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}) {
    const [uncontrolled, setUncontrolled] = useState(defaultOpen);
    const open = openProp ?? uncontrolled;
    const id = useId();

    function setOpen(next: boolean) {
        if (next === open) return;
        if (openProp === undefined) setUncontrolled(next);
        onOpenChange?.(next);
    }

    return (
        <DialogContext.Provider value={{ open, setOpen, titleId: `${id}t`, descriptionId: `${id}d` }}>{children}</DialogContext.Provider>
    );
}

function useOpenButton(value: boolean, onClick?: (event: MouseEvent<HTMLButtonElement>) => void) {
    const { setOpen } = useDialog();
    return (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(value);
    };
}

export function DialogTrigger({ asChild, onClick, ...props }: ComponentProps<'button'> & { asChild?: boolean }) {
    const { open } = useDialog();
    const Component = asChild ? Slot : 'button';
    const handleClick = useOpenButton(true, onClick);
    return (
        <Component
            type={asChild ? undefined : 'button'}
            aria-haspopup="dialog"
            aria-expanded={open}
            data-state={open ? 'open' : 'closed'}
            {...props}
            onClick={handleClick}
        />
    );
}

export function DialogClose({ asChild, onClick, ...props }: ComponentProps<'button'> & { asChild?: boolean }) {
    const Component = asChild ? Slot : 'button';
    const handleClick = useOpenButton(false, onClick);
    return <Component type={asChild ? undefined : 'button'} {...props} onClick={handleClick} />;
}

export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;

function CloseButton() {
    return (
        <DialogClose asChild>
            <IconButton aria-label="Close" size="sm" className="absolute right-3 top-3">
                <X />
            </IconButton>
        </DialogClose>
    );
}

function Layer({ contentRef, children }: { contentRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
    const { setOpen } = useDialog();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const setOpenRef = useRef(setOpen);
    useLayoutEffect(() => {
        setOpenRef.current = setOpen;
    });

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        const content = contentRef.current;
        if (!dialog || !content) return;

        const returnTo = document.activeElement as HTMLElement | null;
        const unlock = lockPage({ blockPointer: false });
        dialog.showModal();
        // First field or button, as Radix did, skipping links and the close button when there's anything else
        const candidates = tabbables(content).filter((el) => el.tagName !== 'A');
        (candidates[0] ?? content).focus({ preventScroll: true });

        const onCancel = (event: Event) => {
            event.preventDefault();
            setOpenRef.current(false);
        };
        dialog.addEventListener('cancel', onCancel);

        return () => {
            dialog.removeEventListener('cancel', onCancel);
            dialog.close();
            unlock();
            if (returnTo?.isConnected) returnTo.focus({ preventScroll: true });
        };
    }, [contentRef]);

    return createPortal(
        <dialog
            ref={dialogRef}
            className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 text-text outline-none backdrop:bg-transparent"
        >
            <div className="fixed inset-0 z-50 bg-overlay" aria-hidden onClick={() => setOpen(false)} />
            {children}
        </dialog>,
        document.body
    );
}

function useContent() {
    const dialog = useDialog();
    const isClient = useIsClient();
    const contentRef = useRef<HTMLDivElement>(null);
    return { ...dialog, contentRef, visible: dialog.open && isClient };
}

type DialogContentProps = ComponentProps<'div'> & {
    title: string;
    description?: ReactNode;
    hideTitle?: boolean;
};

export function DialogContent({ className, children, title, description, hideTitle, ...props }: DialogContentProps) {
    const { visible, contentRef, titleId, descriptionId } = useContent();
    if (!visible) return null;

    return (
        <Layer contentRef={contentRef}>
            <div
                ref={contentRef}
                role="dialog"
                aria-modal
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                data-state="open"
                {...props}
                className={twMerge(
                    'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 outline-none',
                    'rounded-2xl border border-border bg-surface-raised p-6 text-text shadow-raised',
                    className
                )}
            >
                <h2 id={titleId} className={twMerge('pr-8 text-lg font-bold', hideTitle && 'sr-only')}>
                    {title}
                </h2>
                {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-muted">
                        {description}
                    </p>
                )}
                <div className="mt-4">{children}</div>
                <CloseButton />
            </div>
        </Layer>
    );
}

const sheetStyles = cva('fixed z-50 flex flex-col bg-surface text-text shadow-raised outline-none', {
    variants: {
        side: {
            left: 'inset-y-0 left-0 h-full w-[85vw] max-w-xs border-r border-border',
            bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-border pb-[env(safe-area-inset-bottom)]',
        },
    },
    defaultVariants: { side: 'left' },
});

type SheetContentProps = ComponentProps<'div'> & VariantProps<typeof sheetStyles> & { title: string; hideTitle?: boolean };

export function SheetContent({ className, children, side, title, hideTitle, ...props }: SheetContentProps) {
    const { visible, contentRef, titleId } = useContent();
    if (!visible) return null;

    return (
        <Layer contentRef={contentRef}>
            <div
                ref={contentRef}
                role="dialog"
                aria-modal
                aria-labelledby={titleId}
                tabIndex={-1}
                data-state="open"
                {...props}
                className={twMerge(sheetStyles({ side }), className)}
            >
                <h2 id={titleId} className={twMerge('px-4 pt-4 text-base font-bold', hideTitle && 'sr-only')}>
                    {title}
                </h2>
                <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
                <CloseButton />
            </div>
        </Layer>
    );
}
