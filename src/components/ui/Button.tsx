import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { Slot } from 'radix-ui';

export const buttonStyles = cva(
    [
        'inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap',
        'rounded-full font-semibold transition-colors cursor-pointer select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
    ],
    {
        variants: {
            variant: {
                primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
                secondary: 'bg-surface-muted text-text hover:bg-border',
                highlight: 'bg-highlight text-highlight-fg hover:brightness-95',
                outline: 'border border-border-strong text-text hover:bg-surface-muted',
                ghost: 'text-text hover:bg-surface-muted',
                danger: 'bg-danger text-surface hover:brightness-110',
                link: 'h-auto px-0 text-link underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

type ButtonProps = VariantProps<typeof buttonStyles> &
    ComponentProps<'button'> & {
        // Render the child (e.g. a Link) with button styles instead of a <button>
        asChild?: boolean;
    };

export function Button({ variant, size, className, asChild = false, type = 'button', ...props }: ButtonProps) {
    const classes = twMerge(buttonStyles({ variant, size }), className);

    if (asChild) {
        return <Slot.Root {...props} className={classes} />;
    }

    return <button type={type} {...props} className={classes} />;
}

export default Button;
