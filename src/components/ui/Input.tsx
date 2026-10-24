import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import TextUtility from '@/lib/utils/TextUtility';

export const fieldStyles = cva(
    [
        'w-full bg-surface text-text placeholder:text-muted transition-colors',
        'border outline-none focus-visible:outline-none focus:ring-2 focus:ring-focus/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
    ],
    {
        variants: {
            variant: {
                default: 'h-11 px-4 rounded-lg text-base',
                search: 'h-9 px-4 rounded-lg text-sm bg-surface-muted border-transparent focus:bg-surface',
            },
            outline: {
                default: 'border-border-strong focus:border-focus',
                error: 'border-danger focus:border-danger focus:ring-danger/30',
            },
        },
        compoundVariants: [{ variant: 'search', outline: 'default', className: 'border-transparent' }],
        defaultVariants: {
            variant: 'default',
            outline: 'default',
        },
    }
);

type InputProps = VariantProps<typeof fieldStyles> & ComponentProps<'input'>;

export function InputField({ variant, outline, className, type, name, placeholder, ...props }: InputProps) {
    return (
        <input
            {...props}
            type={type}
            id={props.id ?? name}
            placeholder={placeholder ?? (name ? TextUtility.capitalize(name) : undefined)}
            name={name}
            aria-invalid={outline === 'error' || undefined}
            className={twMerge(fieldStyles({ variant, outline }), className)}
        />
    );
}

export default InputField;
