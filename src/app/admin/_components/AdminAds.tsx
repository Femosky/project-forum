'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Megaphone, Pause, Pencil, Play, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import InputField, { selectStyles } from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import ImageUpload from '@/components/common/ImageUpload';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { APP_URL } from '@/lib/constants';
import { COMMUNITY_CATEGORIES } from '@/lib/moderation';
import SponsoredPostCard from '@/ads/SponsoredPostCard';
import SponsoredCommentItem from '@/ads/SponsoredCommentItem';
import type { AdsOverview, Advertiser, Campaign, CampaignDetail, Creative, NativeAdUnit } from '@/ads/types';
import AdPictureField, { type PictureFields } from './AdPictureField';

// Ad campaign management (Phase 6). Direct deals are set up by hand: advertiser, then campaign (dates, targeting,
// price), then creatives. Money is typed in major units (naira) and stored in minor units (kobo).

const toMajor = (minor: number | null | undefined) => (minor === null || minor === undefined ? '' : String(minor / 100));
const toMinor = (major: string) => (major.trim() === '' ? null : Math.round(Number(major) * 100));
const money = (minor: number | null | undefined, currency: string) =>
    minor === null || minor === undefined ? '—' : new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);
const ctr = (impressions: number, clicks: number) => (impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : '—');
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <label className={twMerge('flex min-w-0 flex-col gap-1 text-sm', className)}>
            <span className="font-semibold">{label}</span>
            {children}
        </label>
    );
}

function StatusBadge({ campaign }: { campaign: Pick<Campaign, 'status' | 'ends_at' | 'starts_at'> }) {
    // Read once per mount; render stays pure
    const [now] = useState(() => Date.now());
    if (campaign.status === 'active' && campaign.ends_at && new Date(campaign.ends_at).getTime() <= now) return <Badge>Finished</Badge>;
    if (campaign.status === 'active' && campaign.starts_at && new Date(campaign.starts_at).getTime() > now) return <Badge>Scheduled</Badge>;
    if (campaign.status === 'active') return <Badge variant="highlight">Running</Badge>;
    return <Badge>{{ draft: 'Draft', paused: 'Paused', ended: 'Ended' }[campaign.status]}</Badge>;
}

// --- Overview: AdSense status, advertisers and their campaigns ---

export function AdminAds({ initial }: { initial: AdsOverview }) {
    const [data, setData] = useState(initial);
    const [adding, setAdding] = useState<'advertiser' | string | null>(null);

    async function reload() {
        setData(await api<AdsOverview>('/admin/ads'));
        setAdding(null);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface p-4 text-sm">
                <p className="font-semibold">
                    AdSense:{' '}
                    {!data.ads_enabled ? 'all ads are off (ADS_ENABLED)' : data.adsense.enabled ? (data.adsense.configured ? 'on, filling empty slots' : 'switched on, but the ad unit ids are missing') : 'off'}
                </p>
                <p className="mt-1 text-muted">
                    Slots go to direct campaigns that target the page first, then direct campaigns that run everywhere, then house
                    ads, then AdSense. House ads with a share of slots also win that share outright, so your own products are seen. Turn AdSense on with ADSENSE_ENABLED and the ADSENSE_* ids in the API&apos;s settings.
                </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => setAdding(adding === 'promote' ? null : 'promote')}>
                    <Megaphone className="size-4" /> Promote your own product
                </Button>
                <Button size="sm" onClick={() => setAdding(adding === 'advertiser' ? null : 'advertiser')}>
                    <Plus className="size-4" /> Add advertiser
                </Button>
            </div>
            {adding === 'promote' && <PromoteForm onCancel={() => setAdding(null)} />}
            {adding === 'advertiser' && <AdvertiserForm onSaved={reload} onCancel={() => setAdding(null)} />}

            {data.advertisers.length === 0 && (
                <p className="text-sm text-muted">No advertisers yet. Add one, then give it a campaign. House ads (the site&apos;s own promotions) go under an advertiser too.</p>
            )}

            {data.advertisers.map((advertiser) => (
                <section key={advertiser.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="font-bold">{advertiser.name}</h2>
                            <p className="truncate text-xs text-muted">{[advertiser.contact_email, advertiser.website].filter(Boolean).join(' · ') || 'No contact details'}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setAdding(adding === advertiser.id ? null : advertiser.id)}>
                            <Plus className="size-4" /> New campaign
                        </Button>
                    </header>
                    {adding === advertiser.id && <NewCampaignForm advertiserId={advertiser.id} onCancel={() => setAdding(null)} />}
                    {advertiser.campaigns.length > 0 && (
                        <ul className="flex flex-col divide-y divide-border">
                            {advertiser.campaigns.map((campaign) => (
                                <li key={campaign.id}>
                                    <Link href={`/admin?tab=ads&campaign=${campaign.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm hover:underline">
                                        <span className="font-semibold">{campaign.name}</span>
                                        <StatusBadge campaign={campaign} />
                                        {campaign.kind === 'house' && <Badge>House</Badge>}
                                        <span className="text-xs text-muted">
                                            {campaign.active_creatives}/{campaign.creative_count} ads live · {campaign.impressions.toLocaleString()} views ·{' '}
                                            {campaign.clicks.toLocaleString()} clicks ({ctr(campaign.impressions, campaign.clicks)})
                                            {campaign.spent_minor !== null && campaign.spent_minor !== undefined &&
                                                ` · ${money(campaign.spent_minor, campaign.currency)} of ${money(campaign.budget_minor, campaign.currency)}`}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}
        </div>
    );
}

function AdvertiserForm({ onSaved, onCancel }: { onSaved: () => Promise<void>; onCancel: () => void }) {
    const [fields, setFields] = useState({ name: '', contact_email: '', website: '', logo_url: '', notes: '' });
    const [error, setError] = useState<string | null>(null);
    const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields({ ...fields, [key]: e.target.value });

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        try {
            const body = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim() || null]));
            await api<{ advertiser: Advertiser }>('/admin/ads/advertisers', { method: 'POST', body });
            await onSaved();
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Field label="Name">
                <InputField name="advertiser-name" placeholder="Company name" required value={fields.name} onChange={set('name')} />
            </Field>
            <Field label="Contact email">
                <InputField name="contact_email" type="email" placeholder="ads@example.com" value={fields.contact_email} onChange={set('contact_email')} />
            </Field>
            <Field label="Website">
                <InputField name="website" type="url" placeholder="https://example.com" value={fields.website} onChange={set('website')} />
            </Field>
            <Field label="Logo (square)">
                <ImageUpload endpoint="/admin/images?purpose=ad_logo" aspect="square" label="Logo" value={fields.logo_url || null} onChange={(url) => setFields({ ...fields, logo_url: url ?? '' })} />
            </Field>
            <Field label="Notes (only admins see these)" className="sm:col-span-2">
                <TextArea name="notes" placeholder="Deal terms, contact person" value={fields.notes} onChange={set('notes')} />
            </Field>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="sm:col-span-2" />}
            <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!fields.name.trim()}>
                    Save advertiser
                </Button>
            </div>
        </form>
    );
}

// One step to advertise the site's own things (another app, a feature, an event): an advertiser named after the
// product, a live house campaign with a share of slots, and its first feed ad. Labelled "From us" on the site.
function PromoteForm({ onCancel }: { onCancel: () => void }) {
    const router = useRouter();
    const [fields, setFields] = useState({ product: '', headline: '', body: '', click_url: '', share: '20', logo_url: '', image_url: '' });
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields({ ...fields, [key]: e.target.value });

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsSaving(true);
        try {
            const { advertiser } = await api<{ advertiser: Advertiser }>('/admin/ads/advertisers', {
                method: 'POST',
                body: { name: fields.product.trim(), logo_url: fields.logo_url || null },
            });
            const { campaign } = await api<{ campaign: Campaign }>('/admin/ads/campaigns', {
                method: 'POST',
                body: {
                    advertiser_id: advertiser.id,
                    name: `${fields.product.trim()} (house)`,
                    kind: 'house',
                    status: 'active',
                    house_share: Math.min(Math.max(Number(fields.share) || 0, 0), 50),
                    frequency_cap: 3,
                },
            });
            await api(`/admin/ads/campaigns/${campaign.id}/creatives`, {
                method: 'POST',
                body: {
                    format: 'any',
                    headline: fields.headline.trim(),
                    body: fields.body.trim() || null,
                    image_url: fields.image_url || null,
                    click_url: fields.click_url.trim(),
                },
            });
            router.push(`/admin?tab=ads&campaign=${campaign.id}`);
        } catch (error) {
            setError(errorMessage(error));
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <h3 className="font-bold">Promote your own product</h3>
                <p className="text-sm text-muted">Shows as &quot;From us&quot; in feeds and between comments, even when paid campaigns are running. You can adjust the picture and see every placement on the next screen.</p>
            </div>
            <Field label="Product">
                <InputField name="product" placeholder="Cardernir" required value={fields.product} onChange={set('product')} />
            </Field>
            <Field label="Link">
                <InputField name="click_url" placeholder="https://cardernir.app or /communities" required value={fields.click_url} onChange={set('click_url')} />
            </Field>
            <Field label="Headline" className="sm:col-span-2">
                <InputField name="headline" placeholder="Cardernir: your cards, sorted" required value={fields.headline} onChange={set('headline')} />
            </Field>
            <Field label="Text (optional)" className="sm:col-span-2">
                <TextArea name="body" placeholder="One or two lines about it" value={fields.body} onChange={set('body')} />
            </Field>
            <Field label="Logo (the ad's profile picture)">
                <ImageUpload endpoint="/admin/images?purpose=ad_logo" aspect="square" label="Logo" value={fields.logo_url || null} onChange={(url) => setFields({ ...fields, logo_url: url ?? '' })} />
                <span className="text-xs text-muted">Square, 256 × 256 or bigger. Without one, the first letter shows.</span>
            </Field>
            <Field label="Picture (optional)">
                <ImageUpload endpoint="/admin/images?purpose=ad_image" aspect="card" label="Picture" value={fields.image_url || null} onChange={(url) => setFields({ ...fields, image_url: url ?? '' })} />
                <span className="text-xs text-muted">Best at 1200 × 628. Without one, the link&apos;s preview image is used. Crop and fit on the next screen.</span>
            </Field>
            <Field label="Share of ad slots (%, up to 50)">
                <InputField name="share" type="number" min={0} max={50} value={fields.share} onChange={set('share')} />
            </Field>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="sm:col-span-2" />}
            <div className="flex items-end justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !fields.product.trim() || fields.headline.trim().length < 3 || !fields.click_url.trim()}>
                    Start promoting
                </Button>
            </div>
        </form>
    );
}

function NewCampaignForm({ advertiserId, onCancel }: { advertiserId: string; onCancel: () => void }) {
    const [name, setName] = useState('');
    const [kind, setKind] = useState<Campaign['kind']>('direct');
    const [error, setError] = useState<string | null>(null);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        try {
            const { campaign } = await api<{ campaign: Campaign }>('/admin/ads/campaigns', { method: 'POST', body: { advertiser_id: advertiserId, name: name.trim(), kind } });
            // Straight to the campaign to set dates, targeting and ads
            window.location.assign(`/admin?tab=ads&campaign=${campaign.id}`);
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-lg bg-surface-muted p-3">
            <Field label="Campaign name" className="min-w-48 flex-1">
                <InputField name="campaign-name" placeholder="November launch" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Type">
                <select value={kind} onChange={(e) => setKind(e.target.value as Campaign['kind'])} className={selectStyles}>
                    <option value="direct">Paid (direct)</option>
                    <option value="house">House (our own)</option>
                </select>
            </Field>
            <Button variant="ghost" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
                Create draft
            </Button>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="w-full" />}
        </form>
    );
}

// --- One campaign: settings, ads, numbers ---

export function AdminCampaign({ initial }: { initial: CampaignDetail }) {
    const [detail, setDetail] = useState(initial);
    const { campaign, advertiser } = detail;

    async function reload() {
        setDetail(await api<CampaignDetail>(`/admin/ads/campaigns/${campaign.id}`));
    }

    const totals = detail.creatives.reduce((sum, creative) => ({ impressions: sum.impressions + creative.impressions, clicks: sum.clicks + creative.clicks }), { impressions: 0, clicks: 0 });
    const statsUrl = campaign.stats_token ? `${APP_URL}/ads/stats/${campaign.stats_token}` : null;

    return (
        <div className="flex flex-col gap-4">
            <Link href="/admin?tab=ads" className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                <ArrowLeft className="size-4" /> All campaigns
            </Link>
            <header className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{campaign.name}</h2>
                <StatusBadge campaign={campaign} />
                <span className="text-sm text-muted">for {advertiser.name}</span>
            </header>

            {/* The advertiser's logo shows on every one of its ads */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
                <ImageUpload
                    endpoint="/admin/images?purpose=ad_logo"
                    aspect="square"
                    label="Logo"
                    value={advertiser.logo_url}
                    onChange={async (url) => {
                        await api(`/admin/ads/advertisers/${advertiser.id}`, { method: 'PATCH', body: { logo_url: url } });
                        await reload();
                    }}
                />
                <div className="text-sm">
                    <p className="font-semibold">{advertiser.name} logo (the ads&apos; profile picture)</p>
                    <p className="text-muted">
                        Square, 256 × 256 or bigger. Shown next to the name on every one of {advertiser.name}&apos;s ads.{' '}
                        {advertiser.logo_url ? 'Click it to replace it.' : 'Without one, the first letter shows: click the box to upload.'}
                    </p>
                </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {[
                    ['Viewable impressions', totals.impressions.toLocaleString()],
                    ['Clicks', totals.clicks.toLocaleString()],
                    ['Click-through rate', ctr(totals.impressions, totals.clicks)],
                    campaign.pricing_model === 'cpm'
                        ? ['Spent', `${money(campaign.spent_minor, campaign.currency)} of ${money(campaign.budget_minor, campaign.currency)}`]
                        : ['Flat fee', money(campaign.price_minor, campaign.currency)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-surface px-3 py-2">
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="text-lg font-bold tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>

            {statsUrl && campaign.kind === 'direct' && <ShareStats url={statsUrl} />}

            <CampaignForm campaign={campaign} onSaved={reload} />
            <Creatives campaign={campaign} advertiser={advertiser} creatives={detail.creatives} onChanged={reload} />

            <section className="flex flex-col gap-2">
                <h3 className="font-bold">Last 30 days</h3>
                {detail.days.length === 0 ? (
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
                            {detail.days.map((row) => (
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

function ShareStats({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm">
            <span className="text-muted">Advertiser&apos;s stats page:</span>
            <a href={url} target="_blank" rel="noopener" className="min-w-0 truncate font-semibold text-link hover:underline">
                {url}
            </a>
            <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                }}
            >
                <Copy className="size-4" /> {copied ? 'Copied' : 'Copy'}
            </Button>
        </div>
    );
}

function CampaignForm({ campaign, onSaved }: { campaign: Campaign; onSaved: () => Promise<void> }) {
    const [fields, setFields] = useState({
        name: campaign.name,
        kind: campaign.kind,
        status: campaign.status,
        starts_at: day(campaign.starts_at),
        ends_at: day(campaign.ends_at),
        communities: campaign.targeting.communities.join(', '),
        categories: campaign.targeting.categories,
        pricing_model: campaign.pricing_model,
        price: toMajor(campaign.price_minor),
        budget: toMajor(campaign.budget_minor),
        currency: campaign.currency,
        frequency_cap: campaign.frequency_cap ? String(campaign.frequency_cap) : '',
        priority: String(campaign.priority),
        house_share: String(campaign.house_share ?? 0),
        payment_url: campaign.payment_url ?? '',
        paid: Boolean(campaign.paid_at),
    });
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [error, setError] = useState<string | null>(null);
    const set = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) => {
        setFields({ ...fields, [key]: value });
        setStatus('idle');
    };

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus('saving');
        setError(null);
        try {
            await api(`/admin/ads/campaigns/${campaign.id}`, {
                method: 'PATCH',
                body: {
                    name: fields.name.trim(),
                    kind: fields.kind,
                    status: fields.status,
                    // Whole days, from the start of the first to the end of the last (in the browser's time zone)
                    starts_at: fields.starts_at ? new Date(`${fields.starts_at}T00:00:00`).toISOString() : null,
                    ends_at: fields.ends_at ? new Date(`${fields.ends_at}T23:59:59`).toISOString() : null,
                    targeting: {
                        communities: fields.communities
                            .split(/[\s,]+/)
                            .map((name) => name.replace(/^c\//, '').trim().toLowerCase())
                            .filter(Boolean),
                        categories: fields.categories,
                    },
                    pricing_model: fields.pricing_model,
                    price_minor: toMinor(fields.price),
                    budget_minor: toMinor(fields.budget),
                    currency: fields.currency,
                    frequency_cap: fields.frequency_cap ? Number(fields.frequency_cap) : null,
                    priority: Number(fields.priority) || 0,
                    ...(fields.kind === 'house' ? { house_share: Math.min(Math.max(Number(fields.house_share) || 0, 0), 50) } : {}),
                    payment_url: fields.payment_url.trim() || null,
                    paid: fields.paid,
                },
            });
            await onSaved();
            setStatus('saved');
        } catch (error) {
            setError(errorMessage(error));
            setStatus('idle');
        }
    }

    const runsEverywhere = !fields.communities.trim() && fields.categories.length === 0;

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <h3 className="font-bold sm:col-span-2">Settings</h3>
            <Field label="Name">
                <InputField name="campaign-name" required value={fields.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                    <select value={fields.status} onChange={(e) => set('status', e.target.value as Campaign['status'])} className={selectStyles}>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="ended">Ended</option>
                    </select>
                </Field>
                <Field label="Type">
                    <select value={fields.kind} onChange={(e) => set('kind', e.target.value as Campaign['kind'])} className={selectStyles}>
                        <option value="direct">Paid (direct)</option>
                        <option value="house">House (our own)</option>
                    </select>
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Starts">
                    <InputField name="starts_at" type="date" value={fields.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
                </Field>
                <Field label="Ends">
                    <InputField name="ends_at" type="date" value={fields.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Views per person a day">
                    <InputField name="frequency_cap" type="number" min={1} max={100} placeholder="No limit" value={fields.frequency_cap} onChange={(e) => set('frequency_cap', e.target.value)} />
                </Field>
                <Field label="Priority">
                    <InputField name="priority" type="number" min={-100} max={100} value={fields.priority} onChange={(e) => set('priority', e.target.value)} />
                </Field>
            </div>
            {fields.kind === 'house' && (
                <Field label="Share of ad slots (%)" className="sm:col-span-2">
                    <InputField name="house_share" type="number" min={0} max={50} value={fields.house_share} onChange={(e) => set('house_share', e.target.value)} />
                    <span className="text-xs text-muted">
                        0 = only slots nobody paid for. Up to 50 = shown in that share of slots even when paid campaigns want them (all house ads together max 50%). Frequency caps and where-it-shows rules still apply.
                    </span>
                </Field>
            )}

            <fieldset className="flex flex-col gap-2 sm:col-span-2">
                <legend className="mb-1 text-sm font-semibold">Where it shows</legend>
                <InputField
                    name="communities"
                    aria-label="Communities"
                    placeholder="Communities, separated by commas (e.g. lagos_jobs, tech)"
                    autoCapitalize="none"
                    value={fields.communities}
                    onChange={(e) => set('communities', e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                    {COMMUNITY_CATEGORIES.map((category) => (
                        <label
                            key={category.id}
                            className="cursor-pointer rounded-full border border-border-strong px-3 py-1 text-xs font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-fg"
                        >
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={fields.categories.includes(category.id)}
                                onChange={(e) =>
                                    set('categories', e.target.checked ? [...fields.categories, category.id] : fields.categories.filter((id) => id !== category.id))
                                }
                            />
                            {category.label}
                        </label>
                    ))}
                </div>
                <p className="text-xs text-muted">
                    {runsEverywhere
                        ? 'No targeting: runs on the home feed and every community that carries ads.'
                        : 'Shows in these communities and categories only (not on the home feed).'}
                </p>
            </fieldset>

            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <Field label="Pricing">
                    <select value={fields.pricing_model} onChange={(e) => set('pricing_model', e.target.value as Campaign['pricing_model'])} className={selectStyles}>
                        <option value="flat">Flat fee</option>
                        <option value="cpm">Per 1,000 views</option>
                    </select>
                </Field>
                <Field label={fields.pricing_model === 'cpm' ? 'Price per 1,000' : 'Fee'}>
                    <InputField name="price" type="number" min={0} step="0.01" value={fields.price} onChange={(e) => set('price', e.target.value)} />
                </Field>
                <Field label="Currency">
                    <InputField name="currency" maxLength={3} value={fields.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} />
                </Field>
            </div>
            <Field label={fields.pricing_model === 'cpm' ? 'Budget (stops when spent)' : 'Budget (for your records)'}>
                <InputField name="budget" type="number" min={0} step="0.01" placeholder="None" value={fields.budget} onChange={(e) => set('budget', e.target.value)} />
            </Field>
            <Field label="Payment link (Paystack)">
                <InputField name="payment_url" type="url" placeholder="https://paystack.com/pay/..." value={fields.payment_url} onChange={(e) => set('payment_url', e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={fields.paid} onChange={(e) => set('paid', e.target.checked)} className="size-4 accent-current" />
                Paid {campaign.paid_at && <span className="text-muted">(marked {day(campaign.paid_at)})</span>}
            </label>

            {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="sm:col-span-2" />}
            <div className="flex items-center justify-end gap-3 sm:col-span-2">
                {status === 'saved' && <span className="text-sm text-success">Saved</span>}
                <Button type="submit" disabled={status === 'saving' || !fields.name.trim()}>
                    {status === 'saving' ? 'Saving...' : 'Save settings'}
                </Button>
            </div>
        </form>
    );
}

type PreviewSource = Pick<Creative, 'id' | 'headline' | 'body' | 'cta_label' | 'click_url' | 'link_image_url'> & PictureFields;

const previewUnit = (creative: PreviewSource, campaign: Campaign, advertiser: Advertiser): NativeAdUnit => {
    // Same rule as the API: a page on this site (a /path, this site's address or a local test link) shows the site's name
    let host: string | null = null;
    try {
        const url = new URL(creative.click_url, APP_URL);
        const local = /^(localhost|127\.|10\.|192\.168\.)|\.local$/.test(url.hostname);
        host = url.host === new URL(APP_URL).host || local ? null : url.hostname.replace(/^www\./, '');
    } catch {}
    return {
        kind: campaign.kind,
        id: creative.id,
        campaign_id: campaign.id,
        frequency_cap: null,
        creative: {
            advertiser_name: advertiser.name,
            advertiser_logo: advertiser.logo_url,
            title: creative.headline || 'Headline',
            body: creative.body || null,
            // Same rule as the API: its own picture, else the link's preview image when switched on
            image_url: creative.image_url || (creative.use_link_image ? creative.link_image_url : null) || null,
            image_focus: { x: creative.image_focus_x, y: creative.image_focus_y },
            image_fit: creative.image_fit,
            cta_label: creative.cta_label || 'Learn more',
            display_url: host,
        },
    };
};

const FORMAT_LABELS: Record<Creative['format'], string> = { any: 'Feed and between comments', feed_post: 'Feed', thread_comment: 'Between comments' };

function Creatives({ campaign, advertiser, creatives, onChanged }: { campaign: Campaign; advertiser: Advertiser; creatives: Creative[]; onChanged: () => Promise<void> }) {
    const [isAdding, setIsAdding] = useState(creatives.length === 0);
    const [editing, setEditing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function toggle(creative: Creative) {
        setError(null);
        try {
            await api(`/admin/ads/creatives/${creative.id}`, { method: 'PATCH', body: { is_active: !creative.is_active } });
            await onChanged();
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold">Ads</h3>
                {!isAdding && (
                    <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)}>
                        <Plus className="size-4" /> New ad
                    </Button>
                )}
            </div>
            {isAdding && (
                <CreativeForm
                    campaign={campaign}
                    advertiser={advertiser}
                    onCancel={creatives.length ? () => setIsAdding(false) : undefined}
                    onSaved={async () => {
                        await onChanged();
                        setIsAdding(false);
                    }}
                />
            )}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            {creatives.map((creative) =>
                editing === creative.id ? (
                    <CreativeForm
                        key={creative.id}
                        campaign={campaign}
                        advertiser={advertiser}
                        initial={creative}
                        onCancel={() => setEditing(null)}
                        onSaved={async () => {
                            await onChanged();
                            setEditing(null);
                        }}
                        onChanged={onChanged}
                    />
                ) : (
                    <div key={creative.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge>{FORMAT_LABELS[creative.format]}</Badge>
                            {!creative.is_active && <Badge variant="danger">Paused</Badge>}
                            <span className="flex-1 text-xs text-muted">
                                {creative.impressions.toLocaleString()} views · {creative.clicks.toLocaleString()} clicks ({ctr(creative.impressions, creative.clicks)}) · goes to{' '}
                                <span className="break-all">{creative.click_url}</span>
                            </span>
                            <Button size="sm" variant="outline" onClick={() => setEditing(creative.id)}>
                                <Pencil className="size-4" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggle(creative)}>
                                {creative.is_active ? <Pause className="size-4" /> : <Play className="size-4" />} {creative.is_active ? 'Pause' : 'Resume'}
                            </Button>
                        </div>
                        <Previews unit={previewUnit({ ...creative, image_url: creative.image_url ?? '' }, campaign, advertiser)} format={creative.format} />
                    </div>
                )
            )}
        </section>
    );
}

// Every place the ad can appear, drawn with the same components the site uses. Phone width is drawn at 375px.
function Previews({ unit, format }: { unit: NativeAdUnit; format: Creative['format'] }) {
    const feed = format !== 'thread_comment';
    const comments = format !== 'feed_post';
    return (
        <div className="flex flex-col gap-4">
            {feed && (
                <PreviewPlace label="Feed, computer">
                    {/* The feed column pads cards on wider screens; the preview box does the same so nothing touches its edges */}
                    <SponsoredPostCard unit={unit} preview className="max-w-[45rem] rounded-xl border border-border sm:px-4" />
                </PreviewPlace>
            )}
            {feed && (
                <PreviewPlace label="Feed, phone (375 px)">
                    <SponsoredPostCard unit={unit} preview className="w-[375px] max-w-full rounded-xl border border-border sm:px-4" />
                </PreviewPlace>
            )}
            {comments && (
                <PreviewPlace label="Between comments">
                    <div className="max-w-[45rem] rounded-xl border border-border p-4">
                        <SponsoredCommentItem unit={unit} preview />
                    </div>
                </PreviewPlace>
            )}
        </div>
    );
}

function PreviewPlace({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</span>
            {children}
        </div>
    );
}

type CreativeFormProps = {
    campaign: Campaign;
    advertiser: Advertiser;
    // Editing this ad; otherwise a new one
    initial?: Creative;
    onSaved: () => Promise<void>;
    onCancel?: () => void;
    // Reloads the campaign without closing the form (after fetching the link's preview image again)
    onChanged?: () => Promise<void>;
};

function CreativeForm({ campaign, advertiser, initial, onSaved, onCancel, onChanged }: CreativeFormProps) {
    const [fields, setFields] = useState({
        format: initial?.format ?? ('any' as Creative['format']),
        headline: initial?.headline ?? '',
        body: initial?.body ?? '',
        click_url: initial?.click_url ?? '',
        cta_label: initial?.cta_label ?? 'Learn more',
    });
    const [picture, setPicture] = useState<PictureFields>({
        image_url: initial?.image_url ?? '',
        image_focus_x: initial?.image_focus_x ?? 50,
        image_focus_y: initial?.image_focus_y ?? 50,
        image_fit: initial?.image_fit ?? 'cover',
        use_link_image: initial?.use_link_image ?? true,
    });
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setFields({ ...fields, [key]: e.target.value });

    // The stored preview image belongs to the saved link; a changed link gets a new one on save
    const linkChanged = initial !== undefined && fields.click_url.trim() !== initial.click_url;
    const linkImage = {
        url: linkChanged ? null : (initial?.link_image_url ?? null),
        checkedAt: linkChanged ? null : (initial?.link_image_checked_at ?? null),
        onRefresh:
            initial && !linkChanged && onChanged
                ? async () => {
                      setError(null);
                      try {
                          await api(`/admin/ads/creatives/${initial.id}/link-image`, { method: 'POST' });
                          await onChanged();
                      } catch (error) {
                          setError(errorMessage(error));
                      }
                  }
                : undefined,
    };

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const body = {
                format: fields.format,
                headline: fields.headline.trim(),
                body: fields.body.trim() || null,
                image_url: picture.image_url.trim() || null,
                image_focus_x: picture.image_focus_x,
                image_focus_y: picture.image_focus_y,
                image_fit: picture.image_fit,
                use_link_image: picture.use_link_image,
                click_url: fields.click_url.trim(),
                cta_label: fields.cta_label.trim() || 'Learn more',
            };
            if (initial) await api(`/admin/ads/creatives/${initial.id}`, { method: 'PATCH', body });
            else await api(`/admin/ads/campaigns/${campaign.id}/creatives`, { method: 'POST', body });
            await onSaved();
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    const unit = previewUnit({ id: initial?.id ?? 'preview', ...fields, link_image_url: linkImage.url, ...picture }, campaign, advertiser);

    return (
        <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-surface p-4 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
                <Field label="Where">
                    <select value={fields.format} onChange={set('format')} className={selectStyles}>
                        <option value="any">Feed and between comments</option>
                        <option value="feed_post">Feed only (looks like a post)</option>
                        <option value="thread_comment">Between comments only (looks like a comment)</option>
                    </select>
                </Field>
                <Field label="Headline">
                    <InputField name="headline" required minLength={3} maxLength={120} value={fields.headline} onChange={set('headline')} />
                </Field>
                <Field label="Text (optional)">
                    <TextArea name="ad-body" maxLength={500} value={fields.body} onChange={set('body')} />
                </Field>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Field label="Link">
                        <InputField name="click_url" required placeholder="https://example.com/offer, or /communities for a page here" value={fields.click_url} onChange={set('click_url')} />
                    </Field>
                    <Field label="Button">
                        <InputField name="cta_label" maxLength={24} className="w-36" value={fields.cta_label} onChange={set('cta_label')} />
                    </Field>
                </div>
                <AdPictureField value={picture} onChange={setPicture} linkImage={linkImage} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-semibold">Preview, everywhere it can show</span>
                <Previews unit={unit} format={fields.format} />
            </div>
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="lg:col-span-2" />}
            <div className="flex justify-end gap-2 lg:col-span-2">
                {onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSaving || fields.headline.trim().length < 3 || !fields.click_url.trim()}>
                    {isSaving ? 'Saving...' : initial ? 'Save ad' : 'Add ad'}
                </Button>
            </div>
        </form>
    );
}
