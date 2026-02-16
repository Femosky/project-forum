import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

const buttonStyles = cva(['transition-colors', 'cursor-pointer', 'rounded-4xl', 'active:brightness-95'], {
    variants: {
        variant: {
            default: ['bg-normal', 'hover:bg-hover', 'text-dark'],
            disabled: ['bg-disabled', 'text-dark', 'cursor-not-allowed'],
            dark: ['bg-dark', 'hover:bg-dark-hover', 'text-normal'],
            hot: ['bg-hot', 'text-white', 'hover:bg-hot-hover'],
            transparent: ['hover:bg-translucent'],
            clear: [],
        },
        size: {
            default: ['px-5', 'py-2', 'font-medium', 'text-base'],
            round: ['rounded-full', 'items-center', 'justify-center', 'p-2'],
            special: ['px-5', 'py-3', 'rounded-tl-4xl', 'rounded-bl-4xl', 'rounded-br-4xl'],
            google: ['px-3', 'py-2', 'bg-white', 'border border-black', 'rounded-4xl', 'w-fit', 'font-medium'],
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});

type ButtonProps = VariantProps<typeof buttonStyles> & ComponentProps<'button'>;

export function Button({ variant, size, className, ...props }: ButtonProps) {
    return <button {...props} className={twMerge(buttonStyles({ variant, size }), className)} />;
}

export default Button;
