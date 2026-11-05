'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { PostInsights } from '@/types/api';

// A post's insights for its author: views over the last 30 days, totals, and where readers are and came from.
// Loaded only when opened (the menu imports it lazily), so it adds nothing to the post page's JavaScript.

const number = new Intl.NumberFormat('en');
const percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function countryName(code: string) {
    if (code === 'unknown') return 'Unknown';
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
    } catch {
        return code;
    }
}

export function PostInsightsDialog({ postId, open, onOpenChange }: { postId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
    const [insights, setInsights] = useState<PostInsights | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        api<{ insights: PostInsights }>(`/posts/${postId}/insights`)
            .then(({ insights }) => {
                if (cancelled) return;
                setInsights(insights);
                setError(null);
            })
            .catch((error) => !cancelled && setError(errorMessage(error)));
        return () => {
            cancelled = true;
        };
    }, [open, postId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent title="Insights" description="Only you can see these. Counts update within a minute or two.">
                {error ? (
                    <ErrorMessage size="small" errorMessage={error} role="alert" />
                ) : !insights ? (
                    <p className="py-8 text-center text-sm text-muted">Loading...</p>
                ) : (
                    <InsightsBody insights={insights} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function InsightsBody({ insights }: { insights: PostInsights }) {
    const { totals } = insights;
    const tiles: [string, string][] = [
        ['Views', number.format(totals.views)],
        ['Readers', number.format(totals.readers)],
        ['Shares', number.format(totals.shares)],
        ['Comments', number.format(totals.comments)],
        ['Upvoted', totals.upvote_ratio === null ? '–' : percent.format(totals.upvote_ratio)],
        ['Score', number.format(totals.upvotes - totals.downvotes)],
    ];
    return (
        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
            <dl className="grid grid-cols-3 gap-2">
                {tiles.map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-surface-muted px-3 py-2">
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="text-lg font-bold tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>
            <ViewsChart days={insights.days} />
            {insights.tracked_since && totals.views > 0 && (
                <p className="-mt-3 text-xs text-muted">
                    Views counts every visit since the post went up. Readers, shares and the chart start from{' '}
                    {shortDate.format(new Date(`${insights.tracked_since}T00:00:00Z`))}.
                </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
                <Breakdown title="Where readers came from" rows={insights.sources.map((row) => ({ label: row.key, share: row.share }))} />
                <Breakdown title="Top countries" rows={insights.countries.map((row) => ({ label: countryName(row.key), share: row.share }))} />
            </div>
            <p className="text-xs text-muted">
                Readers is roughly how many different people viewed it. Sources and countries cover the last {insights.breakdown_days} days. Your own
                visits aren&apos;t counted.
            </p>
        </div>
    );
}

// Views per day, as bars, last 30 days
function ViewsChart({ days }: { days: PostInsights['days'] }) {
    const max = Math.max(1, ...days.map((day) => day.views));
    const width = 300;
    const height = 96;
    const gap = 2;
    const bar = (width - gap * (days.length - 1)) / days.length;
    const total = days.reduce((sum, day) => sum + day.views, 0);
    return (
        <figure className="flex flex-col gap-1.5">
            <figcaption className="flex items-baseline justify-between text-sm">
                <span className="font-bold">Views, last 30 days</span>
                <span className="text-muted tabular-nums">{number.format(total)}</span>
            </figcaption>
            <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" preserveAspectRatio="none" role="img" aria-label={`${total} views in the last 30 days`}>
                {days.map((day, index) => {
                    const h = day.views ? Math.max(2, (day.views / max) * height) : 1;
                    return (
                        <rect
                            key={day.date}
                            x={index * (bar + gap)}
                            y={height - h}
                            width={bar}
                            height={h}
                            rx={1}
                            className={day.views ? 'fill-accent' : 'fill-border'}
                        >
                            <title>{`${shortDate.format(new Date(`${day.date}T00:00:00Z`))}: ${day.views} views`}</title>
                        </rect>
                    );
                })}
            </svg>
            <div className="flex justify-between text-xs text-muted">
                <span>{shortDate.format(new Date(`${days[0].date}T00:00:00Z`))}</span>
                <span>Today</span>
            </div>
        </figure>
    );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; share: number }[] }) {
    return (
        <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold">{title}</h3>
            {rows.length === 0 ? (
                <p className="text-sm text-muted">Not enough views yet.</p>
            ) : (
                <ul className="flex flex-col gap-1.5">
                    {rows.map((row) => (
                        <li key={row.label} className="flex flex-col gap-0.5 text-sm">
                            <span className="flex justify-between gap-2">
                                <span className="truncate">{row.label}</span>
                                <span className="text-muted tabular-nums">{percent.format(row.share)}</span>
                            </span>
                            <span className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, row.share * 100)}%` }} />
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default PostInsightsDialog;
