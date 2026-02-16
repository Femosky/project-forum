import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import TextUtility from '@/lib/utils/TextUtility';

const InputStyles = cva(['transition-colors'], {
    variants: {
        variant: {
            default: ['flex-1 px-4 py-2 rounded-sm'],
            search: ['flex-1 px-4 py-2 rounded-4xl'],
        },
        size: {
            default: ['text-base'],
        },
        outline: {
            default: ['border border-gray-200 outline-none focus:ring-0 focus:border-gray-400'],
            error: ['border border-red-500 outline-none'],
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        outline: 'default',
    },
});

type InputProps = VariantProps<typeof InputStyles> & ComponentProps<'input'>;

export function InputField({
    variant,
    size,
    outline,
    className,
    type,
    name,
    placeholder,
    defaultValue,
    ...props
}: InputProps) {
    return (
        <input
            {...props}
            type={type as string}
            id={name as string}
            placeholder={placeholder || TextUtility.capitalize(name as string)}
            name={name as string}
            defaultValue={defaultValue}
            className={twMerge(InputStyles({ variant, size, outline }), className)}
        />
    );
}

export default InputField;
