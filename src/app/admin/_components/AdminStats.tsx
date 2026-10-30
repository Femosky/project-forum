import Link from 'next/link';
import { Download } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { API_BASE } from '@/lib/constants';
import { communityLabel } from '@/lib/communityName';
import { AdminStatsResponse, DailyStats } from '@/types/api';
import { fieldStyles } from '@/components/ui/Input';
import { buttonStyles } from '@/components/ui/Button';
import StatChart from './StatChart';

// Admin -> Stats: numbers for advertiser decks and marketing. Headline tiles are today's live counts; the charts
// and tables are the nightly snapshots for the chosen range (Lagos days). Server-rendered: only the charts' hover
// needs JavaScript.

type Metric = { key: keyof Omit<DailyStats, 'date' | 'countries'>; label: string; level?: boolean };

const CHARTS: Metric[] = [
    { key: 'unique_visitors', label: 'Unique visitors' },
    { key: 'page_views', label: 'Page views' },
    { key: 'dau', label: 'Daily active accounts', level: true },
    { key: 'mau', label: 'Monthly active accounts', level: true },
    { key: 'new_signups', label: 'New sign-ups' },
    { key: 'posts', label: 'Posts' },
    { key: 'comments', label: 'Replies' },
    { key: 'votes', label: 'Votes' },
    { key: 'ad_impressions', label: 'Paid ad views' },
    { key: 'ad_clicks', label: 'Paid ad clicks' },
];

const TODAY: Metric[] = [
    { key: 'unique_visitors', label: 'Visitors today' },
    { key: 'page_views', label: 'Page views today' },
    { key: 'dau', label: 'Active accounts today' },
    { key: 'wau', label: 'Active this week' },
    { key: 'mau', label: 'Active this month' },
    { key: 'total_users', label: 'Accounts' },
    { key: 'new_signups', label: 'Sign-ups today' },
    { key: 'posts', label: 'Posts today' },
];

const RANGES = [7, 30, 90];

const sum = (days: DailyStats[], key: Metric['key']) => days.reduce((total, day) => total + day[key], 0);

export function AdminStats({ data, days }: { data: AdminStatsResponse; days: number | null }) {
    const { range, today } = data;
    const exportQuery = new URLSearchParams({ from: range.from, to: range.to });
    const paidCtr = sum(data.days, 'ad_impressions') ? (sum(data.days, 'ad_clicks') / sum(data.days, 'ad_impressions')) * 100 : null;
    const countries = Object.entries(
        data.days.reduce<Record<string, number>>((all, day) => {
            for (const [code, count] of Object.entries(day.countries ?? {})) all[code] = (all[code] ?? 0) + count;
            return all;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    return (
        <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {TODAY.map(({ key, label }) => (
                    <div key={key} className="rounded-xl border border-border bg-surface px-3 py-2">
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="text-lg font-bold tabular-nums">{today[key].toLocaleString()}</dd>
                    </div>
                ))}
            </dl>

            <div className="flex flex-wrap items-end gap-2">
                <nav aria-label="Range" className="flex gap-1">
                    {RANGES.map((value) => (
                        <Link
                            key={value}
                            href={`/admin?tab=stats&days=${value}`}
                            aria-current={days === value ? 'page' : undefined}
                            className={twMerge(
                                'flex h-8 items-center rounded-full px-3 text-sm font-semibold transition-colors',
                                days === value ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                            )}
                        >
                            {value} days
                        </Link>
                    ))}
                </nav>
                {/* A plain GET form: any range up to a year */}
                <form action="/admin" className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="tab" value="stats" />
                    <label className="flex flex-col gap-0.5 text-xs text-muted">
                        From
                        <input type="date" name="from" defaultValue={range.from} className={twMerge(fieldStyles(), 'h-8 w-auto')} />
                    </label>
                    <label className="flex flex-col gap-0.5 text-xs text-muted">
                        To
                        <input type="date" name="to" defaultValue={range.to} className={twMerge(fieldStyles(), 'h-8 w-auto')} />
                    </label>
                    <button type="submit" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                        Show
                    </button>
                </form>
                <div className="ml-auto flex gap-2">
                    <a href={`${API_BASE}/admin/stats/export?${exportQuery}&kind=daily`} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                        <Download className="size-4" /> Daily CSV
                    </a>
                    <a href={`${API_BASE}/admin/stats/export?${exportQuery}&kind=communities`} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                        <Download className="size-4" /> Communities CSV
                    </a>
                </div>
            </div>

            <p className="text-sm text-muted">
                {range.from} to {range.to}: {sum(data.days, 'unique_visitors').toLocaleString()} visitor-days,{' '}
                {sum(data.days, 'page_views').toLocaleString()} page views, {sum(data.days, 'new_signups').toLocaleString()} sign-ups.
                Paid ads: {sum(data.days, 'ad_impressions').toLocaleString()} views, {sum(data.days, 'ad_clicks').toLocaleString()} clicks
                {paidCtr !== null ? ` (${paidCtr.toFixed(2)}% CTR)` : ''}. House ads (ours): {sum(data.days, 'house_impressions').toLocaleString()} views.
                Bots are not counted.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CHARTS.map(({ key, label, level }) => (
                    <StatChart key={key} label={label} summary={level ? 'latest' : 'total'} points={data.days.map((day) => ({ date: day.date, value: day[key] }))} />
                ))}
            </div>

            <section className="flex flex-col gap-2">
                <h2 className="font-bold">Top communities</h2>
                {data.top_communities.length === 0 ? (
                    <p className="text-sm text-muted">No community activity in this range yet.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                        <table className="w-full text-sm tabular-nums">
                            <thead className="text-left text-xs text-muted">
                                <tr className="border-b border-border">
                                    {['Community', 'Members', 'New', 'Visitors', 'Views', 'Posts', 'Replies', 'Votes'].map((heading, index) => (
                                        <th key={heading} className={twMerge('px-3 py-2 font-medium', index > 0 && 'text-right')}>
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.top_communities.map((community) => (
                                    <tr key={community.name} className="border-b border-border last:border-0">
                                        <td className="px-3 py-2">
                                            <Link href={`/c/${community.name}`} className="font-medium hover:underline">
                                                {communityLabel(community)}
                                            </Link>
                                        </td>
                                        {[community.members, community.new_members, community.visitors, community.page_views, community.posts, community.comments, community.votes].map((value, index) => (
                                            <td key={index} className="px-3 py-2 text-right">
                                                {value.toLocaleString()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {countries.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="font-bold">Visitors by country</h2>
                    <p className="text-sm text-muted">
                        {countries.map(([code, count]) => `${code === 'unknown' ? 'Unknown' : code} ${count.toLocaleString()}`).join(' · ')}
                    </p>
                </section>
            )}

            <details className="rounded-xl border border-border bg-surface">
                <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Every day as a table</summary>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm tabular-nums">
                        <thead className="text-left text-xs text-muted">
                            <tr className="border-b border-border">
                                <th className="px-3 py-2 font-medium">Day</th>
                                {CHARTS.map(({ key, label }) => (
                                    <th key={key} className="px-3 py-2 text-right font-medium">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...data.days].reverse().map((day) => (
                                <tr key={day.date} className="border-b border-border last:border-0">
                                    <td className="whitespace-nowrap px-3 py-1.5">{day.date}</td>
                                    {CHARTS.map(({ key }) => (
                                        <td key={key} className="px-3 py-1.5 text-right">
                                            {day[key].toLocaleString()}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

export default AdminStats;
