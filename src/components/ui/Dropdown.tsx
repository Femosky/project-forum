'use client';

import {
    ComponentProps,
    createContext,
    FocusEvent,
    KeyboardEvent,
    MouseEvent,
    PointerEvent,
    ReactNode,
    RefObject,
    useContext,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';
import { lockPage, useIsClient } from './layer';
import { composeRefs, Slot } from './Slot';

// A small accessible menu with the API of the Radix DropdownMenu it replaced (same data-state/data-highlighted hooks):
// arrow keys, Home/End, Escape, focus back to the trigger on close, flips above the trigger when there's no room below

type MenuContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: RefObject<HTMLElement | null>;
    // Opened from the keyboard: focus the first item, as Radix did
    keyboardRef: RefObject<boolean>;
    menuId: string;
    triggerId: string;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenu() {
    const menu = useContext(MenuContext);
    if (!menu) throw new Error('Dropdown parts must be inside <Dropdown>');
    return menu;
}

export function Dropdown({
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
    const triggerRef = useRef<HTMLElement | null>(null);
    const keyboardRef = useRef(false);
    const id = useId();

    function setOpen(next: boolean) {
        if (next === open) return;
        if (openProp === undefined) setUncontrolled(next);
        onOpenChange?.(next);
    }

    return (
        <MenuContext.Provider value={{ open, setOpen, triggerRef, keyboardRef, menuId: `${id}m`, triggerId: `${id}t` }}>
            {children}
        </MenuContext.Provider>
    );
}

export function DropdownTrigger({ asChild, ref, onClick, onKeyDown, ...props }: ComponentProps<'button'> & { asChild?: boolean }) {
    const { open, setOpen, triggerRef, keyboardRef, menuId, triggerId } = useMenu();
    const Component = asChild ? Slot : 'button';

    return (
        <Component
            type={asChild ? undefined : 'button'}
            id={triggerId}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            data-state={open ? 'open' : 'closed'}
            {...props}
            ref={composeRefs(ref, triggerRef)}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                onClick?.(event);
                if (event.defaultPrevented) return;
                // A click made with Enter or Space has detail 0
                keyboardRef.current = event.detail === 0;
                setOpen(!open);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                onKeyDown?.(event);
                if (event.key === 'ArrowDown' && !event.defaultPrevented) {
                    event.preventDefault();
                    keyboardRef.current = true;
                    setOpen(true);
                }
            }}
        />
    );
}

const ITEM = '[role^="menuitem"]:not([data-disabled])';

function place(content: HTMLElement, trigger: HTMLElement, side: 'top' | 'bottom', align: 'start' | 'center' | 'end', offset: number) {
    const anchor = trigger.getBoundingClientRect();
    const { width, height } = content.getBoundingClientRect();
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = window.innerHeight;

    const below = viewHeight - anchor.bottom - offset;
    const above = anchor.top - offset;
    let actualSide = side;
    if (side === 'bottom' && height > below && above > below) actualSide = 'top';
    if (side === 'top' && height > above && below > above) actualSide = 'bottom';

    let top = actualSide === 'bottom' ? anchor.bottom + offset : anchor.top - offset - height;
    top = Math.max(0, Math.min(top, viewHeight - height));
    let left = align === 'start' ? anchor.left : align === 'end' ? anchor.right - width : anchor.left + (anchor.width - width) / 2;
    left = Math.max(0, Math.min(left, viewWidth - width));

    content.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    content.style.visibility = '';
    content.dataset.side = actualSide;
}

export function DropdownContent({
    className,
    sideOffset = 6,
    align = 'end',
    side = 'bottom',
    children,
    onKeyDown,
    style,
    ...props
}: ComponentProps<'div'> & { sideOffset?: number; align?: 'start' | 'center' | 'end'; side?: 'top' | 'bottom' }) {
    const { open, setOpen, triggerRef, keyboardRef, menuId, triggerId } = useMenu();
    const contentRef = useRef<HTMLDivElement>(null);
    const setOpenRef = useRef(setOpen);
    useLayoutEffect(() => {
        setOpenRef.current = setOpen;
    });
    const isClient = useIsClient();

    useLayoutEffect(() => {
        const content = contentRef.current;
        const trigger = triggerRef.current;
        if (!open || !content || !trigger) return;

        const position = () => place(content, trigger, side, align, sideOffset);
        position();
        const unlock = lockPage({ blockPointer: true });
        const first = keyboardRef.current ? content.querySelector<HTMLElement>(ITEM) : null;
        (first ?? content).focus({ preventScroll: true });

        const close = (event: Event) => {
            if (!content.contains(event.target as Node)) setOpenRef.current(false);
        };
        document.addEventListener('pointerdown', close, true);
        document.addEventListener('focusin', close);
        window.addEventListener('resize', position);

        return () => {
            unlock();
            document.removeEventListener('pointerdown', close, true);
            document.removeEventListener('focusin', close);
            window.removeEventListener('resize', position);
            // Back to the trigger, unless something else (a dialog, another field) has already taken focus
            const active = document.activeElement;
            if (!active || active === document.body || content.contains(active)) trigger.focus({ preventScroll: true });
        };
    }, [open, side, align, sideOffset, triggerRef, keyboardRef]);

    if (!open || !isClient) return null;

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>(ITEM)];
        const index = items.indexOf(document.activeElement as HTMLElement);
        const focusItem = (i: number) => items[(i + items.length) % items.length]?.focus();

        if (event.key === 'ArrowDown') focusItem(index + 1);
        else if (event.key === 'ArrowUp') focusItem(index < 0 ? -1 : index - 1);
        else if (event.key === 'Home' || event.key === 'PageUp') focusItem(0);
        else if (event.key === 'End' || event.key === 'PageDown') focusItem(-1);
        else if (event.key === 'Escape') setOpen(false);
        else if (event.key !== 'Tab') return;
        event.preventDefault();
    }

    return createPortal(
        <div
            ref={contentRef}
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            aria-orientation="vertical"
            tabIndex={-1}
            data-state="open"
            data-align={align}
            {...props}
            onKeyDown={handleKeyDown}
            // Moved into place before paint by the layout effect
            style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'auto', outline: 'none', ...style }}
            className={twMerge(
                'z-50 min-w-44 rounded-[10px] bg-surface-raised p-1 text-[13.5px] text-text shadow-raised',
                className
            )}
        >
            {children}
        </div>,
        // A menu inside a dialog would need portalling into the <dialog> (top layer); none exists today
        document.body
    );
}

const itemClasses =
    'flex h-8 cursor-pointer select-none items-center gap-2.5 rounded-md px-2 font-medium text-muted outline-none data-[highlighted]:bg-active data-[highlighted]:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted';

type ItemProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
    asChild?: boolean;
    disabled?: boolean;
    // Call event.preventDefault() to keep the menu open
    onSelect?: (event: Event) => void;
};

function Item({ asChild, disabled, onSelect, onClick, onKeyDown, onPointerMove, onPointerLeave, onFocus, onBlur, role = 'menuitem', ...props }: ItemProps) {
    const { setOpen } = useMenu();
    const Component = asChild ? Slot : 'div';

    return (
        <Component
            role={role}
            tabIndex={disabled ? undefined : -1}
            aria-disabled={disabled || undefined}
            data-disabled={disabled ? '' : undefined}
            {...props}
            onClick={(event: MouseEvent<HTMLDivElement>) => {
                onClick?.(event);
                if (disabled || event.defaultPrevented) return;
                const select = new Event('menu.select', { cancelable: true });
                onSelect?.(select);
                if (!select.defaultPrevented) setOpen(false);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                onKeyDown?.(event);
                if (event.defaultPrevented || disabled) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                }
            }}
            onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
                onPointerMove?.(event);
                if (!disabled && event.pointerType === 'mouse' && document.activeElement !== event.currentTarget) {
                    event.currentTarget.focus({ preventScroll: true });
                }
            }}
            onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
                onPointerLeave?.(event);
                if (event.pointerType === 'mouse') event.currentTarget.closest<HTMLElement>('[role="menu"]')?.focus({ preventScroll: true });
            }}
            onFocus={(event: FocusEvent<HTMLDivElement>) => {
                onFocus?.(event);
                event.currentTarget.setAttribute('data-highlighted', '');
            }}
            onBlur={(event: FocusEvent<HTMLDivElement>) => {
                onBlur?.(event);
                event.currentTarget.removeAttribute('data-highlighted');
            }}
        />
    );
}

export function DropdownItem({ className, destructive = false, ...props }: ItemProps & { destructive?: boolean }) {
    return <Item {...props} className={twMerge(itemClasses, destructive && 'text-danger [&_svg]:text-danger', className)} />;
}

export function DropdownGroup(props: ComponentProps<'div'>) {
    return <div role="group" {...props} />;
}

const RadioContext = createContext<{ value?: string; onValueChange?: (value: string) => void }>({});

export function DropdownRadioGroup({
    value,
    onValueChange,
    ...props
}: ComponentProps<'div'> & { value?: string; onValueChange?: (value: string) => void }) {
    return (
        <RadioContext.Provider value={{ value, onValueChange }}>
            <div role="group" {...props} />
        </RadioContext.Provider>
    );
}

export function DropdownRadioItem({ className, children, value, onSelect, ...props }: ItemProps & { value: string }) {
    const radio = useContext(RadioContext);
    const checked = radio.value === value;

    return (
        <Item
            {...props}
            role="menuitemradio"
            aria-checked={checked}
            data-state={checked ? 'checked' : 'unchecked'}
            onSelect={(event) => {
                onSelect?.(event);
                radio.onValueChange?.(value);
            }}
            className={twMerge(itemClasses, 'pr-8 relative', className)}
        >
            {children}
            {checked && (
                <span className="absolute right-2.5">
                    <Check />
                </span>
            )}
        </Item>
    );
}

export function DropdownLabel({ className, ...props }: ComponentProps<'div'>) {
    return <div {...props} className={twMerge('px-2 py-1.5 text-xs font-semibold text-subtle', className)} />;
}

export function DropdownSeparator({ className, ...props }: ComponentProps<'div'>) {
    return <div role="separator" aria-orientation="horizontal" {...props} className={twMerge('my-1 h-px bg-border', className)} />;
}
