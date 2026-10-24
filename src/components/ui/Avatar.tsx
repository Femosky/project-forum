'use client';

import { Avatar as RadixAvatar } from 'radix-ui';
import { cva, VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { useDataSaver } from '@/lib/useDataSaver';

const avatarStyles = cva('relative inline-flex shrink-0 overflow-hidden rounded-full', {
    variants: {
        size: {
            sm: 'size-6 text-[10px]',
            md: 'size-8 text-xs',
            lg: 'size-10 text-sm',
            xl: 'size-16 text-xl',
        },
    },
    defaultVariants: { size: 'md' },
});

type AvatarProps = VariantProps<typeof avatarStyles> & {
    name: string;
    src?: string | null;
    className?: string;
};

// Letter avatars get one of these, picked from the name so a community or person keeps the same colour everywhere.
// All take white text at AA contrast; no greens (branding rule).
const FALLBACK_COLOURS = ['#5046e5', '#7c3aed', '#2563eb', '#c026d3', '#db2777', '#e11d48', '#b45309', '#475569'];

function colourFor(name: string): string {
    let hash = 0;
    for (const char of name.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return FALLBACK_COLOURS[hash % FALLBACK_COLOURS.length];
}

// Shows the image when it loads, otherwise the first letter of the name on the name's colour.
// With data saver on, always the letter.
export function Avatar({ name, src: imageSrc, size, className }: AvatarProps) {
    const dataSaver = useDataSaver();
    const src = dataSaver ? null : imageSrc;
    return (
        <RadixAvatar.Root className={twMerge(avatarStyles({ size }), className)} style={{ backgroundColor: colourFor(name) }}>
            {src && <RadixAvatar.Image src={src} alt={`${name}'s avatar`} className="size-full object-cover" />}
            <RadixAvatar.Fallback
                delayMs={src ? 300 : 0}
                className="flex size-full items-center justify-center font-bold uppercase text-white"
            >
                {name.replace(/[^a-z0-9]/gi, '').charAt(0) || '?'}
            </RadixAvatar.Fallback>
        </RadixAvatar.Root>
    );
}

export default Avatar;
