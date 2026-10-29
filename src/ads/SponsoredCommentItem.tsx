'use client';

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { adClickUrl } from './config';
import { APP_NAME } from '@/lib/constants';
import { useAdImpression } from './impressions';
import AdMenu from './AdMenu';
import type { NativeAdUnit } from './types';

// A native ad between top-level comments, never inside a thread, so it can't read as an answer to someone. Laid out
// like a comment (logo, name line, text) with a "Sponsored" tag and a link card; no voting or replies.
export function SponsoredCommentItem({ unit, preview = false }: { unit: NativeAdUnit; preview?: boolean }) {
    const ref = useRef<HTMLElement>(null);
    useAdImpression(ref, unit, !preview);
    const { creative } = unit;
    const href = adClickUrl(unit.id);

    return (
        <aside ref={ref} aria-label={`Sponsored: ${creative.title}`} className="grid w-full grid-cols-[28px_minmax(0,1fr)] gap-x-2.5">
            <Avatar name={creative.advertiser_name} src={creative.advertiser_logo} shape="square" size="md" className="size-7 text-[11px]" />
            <div className="flex min-w-0 flex-col">
                <div className="flex min-h-7 items-center gap-1.5 text-[13px]">
                    <span className="truncate font-semibold text-text">{creative.advertiser_name}</span>
                    <Badge variant="sponsored">{unit.kind === 'house' ? 'From us' : 'Sponsored'}</Badge>
                    {!preview && (
                        <div className="ml-auto">
                            <AdMenu unit={unit} />
                        </div>
                    )}
                </div>
                <p className="text-sm leading-[21px] text-body">
                    <span className="font-medium text-text">{creative.title}</span>
                    {creative.body && <> {creative.body}</>}
                </p>
                <a
                    href={preview ? undefined : href}
                    target="_blank"
                    rel="sponsored noopener"
                    className="mt-2 flex items-center justify-between gap-3 rounded-[10px] py-2 pl-3 pr-2 text-[13px] font-medium text-subtle ring-1 ring-inset ring-border transition-colors hover:ring-border-strong"
                >
                    <span className="flex min-w-0 items-center gap-1 truncate">
                        {creative.display_url ?? APP_NAME} <ExternalLink className="size-3 shrink-0" />
                    </span>
                    <span className="flex h-7 shrink-0 items-center rounded-[7px] px-3 text-[13px] font-semibold text-text ring-1 ring-inset ring-border-strong">
                        {creative.cta_label}
                    </span>
                </a>
            </div>
        </aside>
    );
}

export default SponsoredCommentItem;
