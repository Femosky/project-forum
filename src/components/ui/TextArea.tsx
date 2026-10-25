import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import TextUtility from '@/lib/utils/TextUtility';

const textAreaStyles = cva(
    [
        'w-full bg-surface text-text placeholder:text-muted resize-none field-sizing-content transition-colors',
        'outline-none focus-visible:outline-none',
    ],
    {
        variants: {
            variant: {
                default: 'min-h-24 px-3 py-2.5 rounded-[7px] text-[15px] border focus:ring-4 focus:ring-active',
                // Borderless, for use inside a composer that draws its own frame
                bare: 'min-h-16 px-1 py-1 text-[15px] bg-transparent border-none',
            },
            outline: {
                default: 'border-border-strong focus:border-muted',
                error: 'border-danger focus:border-danger',
            },
        },
        defaultVariants: {
            variant: 'default',
            outline: 'default',
        },
    }
);

type TextAreaProps = VariantProps<typeof textAreaStyles> & ComponentProps<'textarea'>;

export function TextArea({ variant, outline, className, name, placeholder, ...props }: TextAreaProps) {
    return (
        <textarea
            {...props}
            id={props.id ?? name}
            placeholder={placeholder ?? (name ? TextUtility.capitalize(name) : undefined)}
            name={name}
            aria-invalid={outline === 'error' || undefined}
            className={twMerge(textAreaStyles({ variant, outline }), className)}
        />
    );
}

export default TextArea;
