import { twMerge } from 'tailwind-merge';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import TextUtility from '@/lib/utils/TextUtility';

export const fieldStyles = cva(
    [
        'w-full bg-surface text-text placeholder:text-subtle transition-colors',
        'border outline-none focus-visible:outline-none focus:ring-4 focus:ring-active',
        'disabled:cursor-not-allowed disabled:opacity-50',
    ],
    {
        variants: {
            variant: {
                default: 'h-10 px-3 rounded-[7px] text-[15px]',
                search: 'h-9 px-3 rounded-[7px] text-sm bg-hover border-transparent focus:bg-surface',
            },
            outline: {
                default: 'border-border-strong focus:border-muted',
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
