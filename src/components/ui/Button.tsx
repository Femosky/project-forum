import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { Slot } from 'radix-ui';

export const buttonStyles = cva(
    [
        'inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap',
        'rounded-[7px] font-semibold transition-colors cursor-pointer select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
    ],
    {
        variants: {
            variant: {
                primary: 'bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.12)] hover:bg-accent-hover',
                secondary: 'bg-surface text-text ring-1 ring-inset ring-border-strong hover:bg-hover',
                highlight: 'bg-highlight text-highlight-fg hover:brightness-95',
                outline: 'text-text ring-1 ring-inset ring-border-strong hover:bg-hover',
                ghost: 'text-muted hover:bg-hover hover:text-text',
                danger: 'bg-brand text-white hover:brightness-110',
                link: 'h-auto px-0 text-link underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3 text-[13.5px]',
                md: 'h-9 px-4 text-sm',
                lg: 'h-11 px-5 text-[15px]',
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
