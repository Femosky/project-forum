import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type DividerLineProps = ComponentProps<'div'>;

export function DividerLine({ className, ...props }: DividerLineProps) {
    return <div role="separator" {...props} className={twMerge('border-t border-border w-full', className)} />;
}
