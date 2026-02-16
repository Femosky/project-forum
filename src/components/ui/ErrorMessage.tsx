import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

const ErrorMessageStyles = cva(['transition-colors'], {
    variants: {
        variant: {
            default: ['text-red-500'],
        },
        size: {
            default: ['text-xs'],
            small: ['text-sm'],
            base: ['text-base'],
            medium: ['text-lg'],
            large: ['text-xl'],
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});

type ErrorMessageProps = VariantProps<typeof ErrorMessageStyles> & ComponentProps<'p'> & { errorMessage: string };

export function ErrorMessage({ variant, size, className, errorMessage, ...props }: ErrorMessageProps) {
    return (
        <p {...props} className={twMerge(ErrorMessageStyles({ variant, size }), className)}>
            {errorMessage}
        </p>
    );
}

export default ErrorMessage;
