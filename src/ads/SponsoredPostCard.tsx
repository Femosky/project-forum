'use client';

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { adClickUrl } from './config';
import { useAdImpression } from './impressions';
import AdMenu from './AdMenu';
import type { NativeAdUnit } from './types';

// A native ad in the feed. Same frame as a compact PostCard, but with the advertiser in place of the community,
// a clear "Sponsored" label, no voting, and the whole card linking out through the click counter.
// `preview` (the admin panel) counts nothing and links nowhere.
export function SponsoredPostCard({ unit, className, preview = false }: { unit: NativeAdUnit; className?: string; preview?: boolean }) {
    const ref = useRef<HTMLElement>(null);
    useAdImpression(ref, unit, !preview);
    const { creative } = unit;
    const href = adClickUrl(unit.id);

    return (
        <article
            ref={ref}
            aria-label={`Sponsored: ${creative.title}`}
            className={twMerge(
                'relative flex flex-col gap-2 bg-surface px-4 py-3 transition-colors hover:bg-surface-muted/60 sm:rounded-xl sm:border sm:border-border',
                className
            )}
        >
            {!preview && <a href={href} target="_blank" rel="sponsored noopener" className="absolute inset-0 sm:rounded-xl" aria-label={creative.title} />}

            <header className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
                    <Avatar name={creative.advertiser_name} src={creative.advertiser_logo} size="sm" />
                    <span className="truncate font-bold text-text">{creative.advertiser_name}</span>
                    <span aria-hidden>•</span>
                    <Badge variant="sponsored">{unit.kind === 'house' ? 'From us' : 'Sponsored'}</Badge>
                </div>
                {!preview && <AdMenu unit={unit} />}
            </header>

            <h2 className="text-lg font-bold leading-snug break-words">{creative.title}</h2>
            {creative.body && <p className="line-clamp-3 break-words text-sm text-muted">{creative.body}</p>}

            {creative.image_url && (
                // Advertiser images come from anywhere, so next/image's allow-list doesn't apply. Fixed aspect ratio
                // keeps the card's height known before the image loads.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creative.image_url} alt="" loading="lazy" className="data-saver-hide aspect-[1.91/1] w-full rounded-xl border border-border object-cover" />
            )}

            <footer className="mt-1 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 truncate text-xs text-link">
                    {creative.display_url} <ExternalLink className="size-3 shrink-0" />
                </span>
                <span className="flex h-8 shrink-0 items-center rounded-lg bg-accent px-3 text-sm font-semibold text-accent-fg">
                    {creative.cta_label}
                </span>
            </footer>
        </article>
    );
}

export default SponsoredPostCard;
