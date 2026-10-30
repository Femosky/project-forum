'use client';

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { adClickUrl } from './config';
import { APP_NAME } from '@/lib/constants';
import { useAdImpression } from './impressions';
import AdMenu from './AdMenu';
import AdPicture from './AdPicture';
import type { NativeAdUnit } from './types';

// A native ad in the feed. Same row as a post (see PostCard), with the advertiser's logo and name in place of the author,
// a plain "Sponsored" tag, no voting, one fixed-ratio image and a single secondary call to action. The whole row links
// out through the click counter. `preview` (the admin panel) counts nothing and links nowhere.
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
                "relative grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-4 pb-4 pt-[22px] before:absolute before:inset-y-1 before:inset-x-1 before:rounded-[10px] before:transition-colors before:content-[''] hover:before:bg-hover sm:px-0 sm:before:-inset-x-3",
                className
            )}
        >
            {!preview && <a href={href} target="_blank" rel="sponsored noopener" className="absolute inset-0 z-[1]" aria-label={creative.title} />}

            <Avatar name={creative.advertiser_name} src={creative.advertiser_logo} shape="square" size="lg" className="size-9" />

            <div className="pointer-events-none relative z-[2] flex min-w-0 flex-col [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
                <div className="flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px]">
                    <span className="truncate font-semibold text-text">{creative.advertiser_name}</span>
                    <Badge variant="sponsored">{unit.kind === 'house' ? 'From us' : 'Sponsored'}</Badge>
                    {!preview && (
                        <div className="-my-1 -mr-1.5 ml-auto">
                            <AdMenu unit={unit} />
                        </div>
                    )}
                </div>

                <h2 className="mb-1 mt-2 text-[15.5px] font-medium leading-[22px] tracking-[-0.003em] break-words text-pretty">{creative.title}</h2>
                {creative.body && <p className="line-clamp-2 break-words text-[14.5px] leading-[22px] text-muted">{creative.body}</p>}

                {creative.image_url && (
                    // A fixed 1.91:1 frame keeps the row's height known before the picture loads
                    <AdPicture
                        src={creative.image_url}
                        focus={creative.image_focus}
                        fit={creative.image_fit}
                        className="mt-3 aspect-[1.91/1] w-full rounded-xl ring-1 ring-border"
                    />
                )}

                <footer className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1 truncate text-[13px] font-medium text-subtle">
                        {creative.display_url ?? APP_NAME} <ExternalLink className="size-3 shrink-0" />
                    </span>
                    <span className="flex h-[30px] shrink-0 items-center rounded-[7px] px-3 text-[13.5px] font-semibold text-text ring-1 ring-inset ring-border-strong">
                        {creative.cta_label}
                    </span>
                </footer>
            </div>
        </article>
    );
}

export default SponsoredPostCard;
