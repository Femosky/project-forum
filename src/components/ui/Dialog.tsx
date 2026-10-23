'use client';

import { Dialog as RadixDialog } from 'radix-ui';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';
import IconButton from './IconButton';

// Dialog (centred) and Sheet (slides in from an edge) share Radix Dialog underneath

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

function Overlay() {
    return (
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
    );
}

function CloseButton() {
    return (
        <RadixDialog.Close asChild>
            <IconButton aria-label="Close" size="sm" className="absolute right-3 top-3">
                <X />
            </IconButton>
        </RadixDialog.Close>
    );
}

type DialogContentProps = ComponentProps<typeof RadixDialog.Content> & {
    title: string;
    description?: ReactNode;
    hideTitle?: boolean;
};

export function DialogContent({ className, children, title, description, hideTitle, ...props }: DialogContentProps) {
    return (
        <RadixDialog.Portal>
            <Overlay />
            <RadixDialog.Content
                // Radix warns when there is no description unless this is explicitly undefined
                {...(description ? {} : { 'aria-describedby': undefined })}
                {...props}
                className={twMerge(
                    'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
                    'rounded-2xl border border-border bg-surface-raised p-6 text-text shadow-raised',
                    className
                )}
            >
                <RadixDialog.Title className={twMerge('pr-8 text-lg font-bold', hideTitle && 'sr-only')}>
                    {title}
                </RadixDialog.Title>
                {description && (
                    <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description>
                )}
                <div className="mt-4">{children}</div>
                <CloseButton />
            </RadixDialog.Content>
        </RadixDialog.Portal>
    );
}

const sheetStyles = cva('fixed z-50 flex flex-col bg-surface text-text shadow-raised', {
    variants: {
        side: {
            left: 'inset-y-0 left-0 h-full w-[85vw] max-w-xs border-r border-border',
            bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-border pb-[env(safe-area-inset-bottom)]',
        },
    },
    defaultVariants: { side: 'left' },
});

type SheetContentProps = ComponentProps<typeof RadixDialog.Content> &
    VariantProps<typeof sheetStyles> & { title: string; hideTitle?: boolean };

export function SheetContent({ className, children, side, title, hideTitle, ...props }: SheetContentProps) {
    return (
        <RadixDialog.Portal>
            <Overlay />
            <RadixDialog.Content
                aria-describedby={undefined}
                {...props}
                className={twMerge(sheetStyles({ side }), className)}
            >
                <RadixDialog.Title className={twMerge('px-4 pt-4 text-base font-bold', hideTitle && 'sr-only')}>
                    {title}
                </RadixDialog.Title>
                <div className="flex-1 overflow-y-auto">{children}</div>
                <CloseButton />
            </RadixDialog.Content>
        </RadixDialog.Portal>
    );
}
