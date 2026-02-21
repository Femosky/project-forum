import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import TextUtility from '@/lib/utils/TextUtility';

const TextAreaStyles = cva(['transition-colors', 'resize-none', 'field-sizing-content'], {
    variants: {
        variant: {
            default: ['flex-1 px-4 py-2 rounded-sm'],
            search: ['flex-1 px-4 py-2 rounded-4xl'],
            'add-reply': ['border-none'],
        },
        size: {
            default: ['text-base'],
            'add-reply': ['text-xs min-h-10 px-3'],
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

type TextAreaProps = VariantProps<typeof TextAreaStyles> & ComponentProps<'textarea'>;

export function TextArea({
    variant,
    size,
    outline,
    className,
    name,
    placeholder,
    defaultValue,
    ...props
}: TextAreaProps) {
    return (
        <textarea
            {...props}
            id={name as string}
            placeholder={placeholder || TextUtility.capitalize(name as string)}
            name={name as string}
            defaultValue={defaultValue}
            className={twMerge(TextAreaStyles({ variant, size, outline }), className)}
        />
    );
}

export default TextArea;
