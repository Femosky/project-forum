import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type DividerLineProps = ComponentProps<'div'>;

export function DividerLine({ className, ...props }: DividerLineProps) {
    return <div {...props} className={twMerge('border-t border-gray-200 w-full', className)} />;
}
