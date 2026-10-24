'use client';

import { Avatar as RadixAvatar } from 'radix-ui';
import { cva, VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { useDataSaver } from '@/lib/useDataSaver';

const avatarStyles = cva('relative inline-flex shrink-0 overflow-hidden bg-highlight', {
    variants: {
        // People are round, communities are rounded squares
        shape: {
            round: 'rounded-full',
            square: 'rounded-[28%]',
        },
        size: {
            sm: 'size-6 text-[10px]',
            md: 'size-8 text-xs',
            lg: 'size-10 text-sm',
            xl: 'size-16 text-xl',
        },
    },
    defaultVariants: { size: 'md', shape: 'round' },
});

type AvatarProps = VariantProps<typeof avatarStyles> & {
    name: string;
    src?: string | null;
    className?: string;
};

// Shows the image when it loads, otherwise the first letter of the name on the highlight colour.
// With data saver on, always the letter.
export function Avatar({ name, src: imageSrc, size, shape, className }: AvatarProps) {
    const dataSaver = useDataSaver();
    const src = dataSaver ? null : imageSrc;
    return (
        <RadixAvatar.Root className={twMerge(avatarStyles({ size, shape }), className)}>
            {src && <RadixAvatar.Image src={src} alt={`${name}'s avatar`} className="size-full object-cover" />}
            <RadixAvatar.Fallback
                delayMs={src ? 300 : 0}
                className="flex size-full items-center justify-center font-bold uppercase text-highlight-fg"
            >
                {name.replace(/[^a-z0-9]/gi, '').charAt(0) || '?'}
            </RadixAvatar.Fallback>
        </RadixAvatar.Root>
    );
}

export default Avatar;
