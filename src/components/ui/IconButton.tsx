import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { Slot } from 'radix-ui';

const iconButtonStyles = cva(
    [
        'inline-flex items-center justify-center shrink-0 rounded-lg transition-colors cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&_svg]:size-5',
    ],
    {
        variants: {
            variant: {
                ghost: 'text-muted hover:bg-surface-muted hover:text-text',
                secondary: 'border border-border bg-surface text-text hover:bg-surface-muted',
                primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
            },
            size: {
                sm: 'size-8 [&_svg]:size-4',
                md: 'size-10',
            },
        },
        defaultVariants: {
            variant: 'ghost',
            size: 'md',
        },
    }
);

// Icon-only buttons need a label for screen readers, so aria-label is required
type IconButtonProps = VariantProps<typeof iconButtonStyles> &
    ComponentProps<'button'> & { 'aria-label': string; asChild?: boolean };

export function IconButton({ variant, size, className, asChild = false, type = 'button', ...props }: IconButtonProps) {
    const classes = twMerge(iconButtonStyles({ variant, size }), className);

    if (asChild) {
        return <Slot.Root {...props} className={classes} />;
    }

    return <button type={type} {...props} className={classes} />;
}

export default IconButton;
