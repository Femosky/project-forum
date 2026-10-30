import { twMerge } from 'tailwind-merge';
import type { PostImage } from '@/types/api';

// A picture post's picture. Its stored width and height set the box before it loads (nothing moves), capped in height
// so a tall photo doesn't fill the screen: the rest of the box shows the picture whole on a quiet background. The
// browser picks the smaller copy on narrow screens. Data saver hides it.
// sizes: how wide it shows, so the browser picks the 720 px copy in feeds and the 2048 px one on the post's page
export default function PostPicture({ image, maxHeight, sizes, className }: { image: PostImage; maxHeight: string; sizes: string; className?: string }) {
    const sources = [...image.variants].sort((a, b) => a.width - b.width);
    return (
        <div
            className={twMerge('data-saver-hide overflow-hidden rounded-xl bg-surface-muted ring-1 ring-border', className)}
            style={{ aspectRatio: `${image.width} / ${image.height}`, maxHeight }}
        >
            {/* Our own storage, so no next/image allow-list; srcset gives phones the smaller copy */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={image.url}
                srcSet={sources.length ? sources.map((source) => `${source.url} ${source.width}w`).join(', ') : undefined}
                sizes={sizes}
                width={image.width}
                height={image.height}
                alt=""
                loading="lazy"
                className="size-full object-contain"
            />
        </div>
    );
}
