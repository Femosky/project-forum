import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
    return <div aria-hidden {...props} className={twMerge('animate-pulse rounded-md bg-surface-muted', className)} />;
}

export default Skeleton;
