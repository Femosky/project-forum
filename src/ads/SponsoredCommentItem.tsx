'use client';

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { adClickUrl } from './config';
import { useAdImpression } from './impressions';
import AdMenu from './AdMenu';
import type { NativeAdUnit } from './types';

// A native ad between top-level comments. Laid out like a comment (avatar column, name line, text), labelled
// "Sponsored", with no voting or replies.
export function SponsoredCommentItem({ unit, preview = false }: { unit: NativeAdUnit; preview?: boolean }) {
    const ref = useRef<HTMLElement>(null);
    useAdImpression(ref, unit, !preview);
    const { creative } = unit;
    const href = adClickUrl(unit.id);

    return (
        <aside ref={ref} aria-label={`Sponsored: ${creative.title}`} className="flex w-full gap-2.5 rounded-xl bg-surface-muted/50 py-2 pr-2">
            <Avatar name={creative.advertiser_name} src={creative.advertiser_logo} size="md" />
            <div className="flex min-w-0 w-full flex-col gap-1">
                <div className="flex min-h-8 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted">
                        <span className="truncate font-bold text-text">{creative.advertiser_name}</span>
                        <span aria-hidden>•</span>
                        <Badge variant="sponsored">{unit.kind === 'house' ? 'From us' : 'Sponsored'}</Badge>
                    </div>
                    {!preview && <AdMenu unit={unit} />}
                </div>
                <a href={preview ? undefined : href} target="_blank" rel="sponsored noopener" className="group flex flex-col gap-1">
                    <span className="font-semibold leading-snug group-hover:underline">{creative.title}</span>
                    {creative.body && <span className="text-sm text-muted">{creative.body}</span>}
                    <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-link">
                        {creative.cta_label} <span className="font-normal text-muted">· {creative.display_url}</span>
                        <ExternalLink className="size-3 shrink-0" />
                    </span>
                </a>
            </div>
        </aside>
    );
}

export default SponsoredCommentItem;
