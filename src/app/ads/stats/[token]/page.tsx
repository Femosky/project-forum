import { notFound } from 'next/navigation';
import { CloudOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import EmptyState from '@/components/ui/EmptyState';
import type { AdStatsResponse } from '@/ads/types';

export const metadata = { title: `Campaign stats | ${APP_NAME}`, robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ token: string }> };

const ctr = (impressions: number, clicks: number) => (impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : '—');
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

// The read-only page an advertiser gets a link to. The token in the URL is the only key, so it shows numbers and
// nothing about money or other campaigns.
export default async function AdStatsPage({ params }: PageProps) {
    const { token } = await params;
    const { data, status } = await serverApi<AdStatsResponse>(`/ads/stats/${encodeURIComponent(token)}`);
    if (status === 404) notFound();
    if (!data) return <EmptyState icon={<CloudOff />} title="Couldn't load these numbers" description="Try again in a moment." />;

    const { campaign, totals } = data;
    const dates = [date(campaign.starts_at), date(campaign.ends_at)];

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 px-4 py-4">
            <header>
                <p className="text-sm text-muted">{campaign.advertiser}</p>
                <h1 className="text-2xl font-extrabold">{campaign.name}</h1>
                <p className="text-sm text-muted">
                    {dates[0] || dates[1] ? `${dates[0] ?? 'Open start'} to ${dates[1] ?? 'no end date'}` : 'No fixed dates'} · {campaign.status}
                </p>
            </header>
            <dl className="grid grid-cols-3 gap-2 text-sm">
                {[
                    ['Viewable impressions', totals.impressions.toLocaleString()],
                    ['Clicks', totals.clicks.toLocaleString()],
                    ['Click-through rate', ctr(totals.impressions, totals.clicks)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-surface px-3 py-2">
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="text-lg font-bold tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="text-xs text-muted">
                An impression counts when at least half of the ad has been on screen for one second. Days run on Lagos time (WAT).
            </p>

            <section className="flex flex-col gap-2">
                <h2 className="font-bold">By ad</h2>
                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                    {data.creatives.map((creative, index) => (
                        <li key={index} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                            <span className="font-semibold">{creative.headline}</span>
                            <span className="text-muted tabular-nums">
                                {creative.impressions.toLocaleString()} views · {creative.clicks.toLocaleString()} clicks · {ctr(creative.impressions, creative.clicks)}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="font-bold">By day</h2>
                {data.days.length === 0 ? (
                    <p className="text-sm text-muted">No views yet.</p>
                ) : (
                    <table className="w-full rounded-xl border border-border bg-surface text-sm">
                        <thead className="text-left text-xs text-muted">
                            <tr>
                                <th className="px-3 py-2 font-semibold">Day</th>
                                <th className="px-3 py-2 text-right font-semibold">Views</th>
                                <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                                <th className="px-3 py-2 text-right font-semibold">CTR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border tabular-nums">
                            {data.days.map((row) => (
                                <tr key={row.date}>
                                    <td className="px-3 py-1.5">{row.date}</td>
                                    <td className="px-3 py-1.5 text-right">{row.impressions.toLocaleString()}</td>
                                    <td className="px-3 py-1.5 text-right">{row.clicks.toLocaleString()}</td>
                                    <td className="px-3 py-1.5 text-right">{ctr(row.impressions, row.clicks)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
