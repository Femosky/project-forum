'use client';

import { DropdownMenu } from 'radix-ui';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

// Thin styled wrappers over Radix DropdownMenu (keyboard, focus and portal handling come from Radix)

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;
export const DropdownGroup = DropdownMenu.Group;
export const DropdownRadioGroup = DropdownMenu.RadioGroup;

export function DropdownContent({
    className,
    sideOffset = 6,
    align = 'end',
    ...props
}: ComponentProps<typeof DropdownMenu.Content>) {
    return (
        <DropdownMenu.Portal>
            <DropdownMenu.Content
                sideOffset={sideOffset}
                align={align}
                {...props}
                className={twMerge(
                    'z-50 min-w-44 rounded-xl border border-border bg-surface-raised p-1 text-sm text-text shadow-raised',
                    className
                )}
            />
        </DropdownMenu.Portal>
    );
}

const itemClasses =
    'flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 outline-none data-[highlighted]:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted';

export function DropdownItem({
    className,
    destructive = false,
    ...props
}: ComponentProps<typeof DropdownMenu.Item> & { destructive?: boolean }) {
    return (
        <DropdownMenu.Item
            {...props}
            className={twMerge(itemClasses, destructive && 'text-danger [&_svg]:text-danger', className)}
        />
    );
}

export function DropdownRadioItem({ className, children, ...props }: ComponentProps<typeof DropdownMenu.RadioItem>) {
    return (
        <DropdownMenu.RadioItem {...props} className={twMerge(itemClasses, 'pr-8 relative', className)}>
            {children}
            <DropdownMenu.ItemIndicator className="absolute right-2.5">
                <Check />
            </DropdownMenu.ItemIndicator>
        </DropdownMenu.RadioItem>
    );
}

export function DropdownLabel({ className, ...props }: ComponentProps<typeof DropdownMenu.Label>) {
    return (
        <DropdownMenu.Label
            {...props}
            className={twMerge('px-2.5 py-1.5 text-xs font-semibold text-muted', className)}
        />
    );
}

export function DropdownSeparator({ className, ...props }: ComponentProps<typeof DropdownMenu.Separator>) {
    return <DropdownMenu.Separator {...props} className={twMerge('my-1 h-px bg-border', className)} />;
}
