'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Copy, Megaphone, Pause, Pencil, Play, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Avatar from '@/components/ui/Avatar';
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
import type { AdsOverview, Advertiser, Campaign, CampaignDetail, CampaignSummary, Creative, NativeAdUnit } from '@/ads/types';
import AdPictureField, { type PictureFields } from './AdPictureField';

// Admin -> Ads. The overview lists campaigns by where they stand (running, waiting, finished) with the two ways to
// start one: promoting the site's own things, or a paid campaign for an advertiser. A campaign page goes top to bottom
// in the order things are set up: basics, the ads themselves, where and when they run, billing (paid ones only),
// results. Money is typed in major units (naira) and stored in minor units (kobo).

const toMajor = (minor: number | null | undefined) => (minor === null || minor === undefined ? '' : String(minor / 100));
const toMinor = (major: string) => (major.trim() === '' ? null : Math.round(Number(major) * 100));
const money = (minor: number | null | undefined, currency: string) =>
    minor === null || minor === undefined ? '—' : new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);
const ctr = (impressions: number, clicks: number) => (impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : '—');
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
    return (
        <label className={twMerge('flex min-w-0 flex-col gap-1 text-sm', className)}>
            <span className="font-semibold">{label}</span>
            {children}
            {hint && <span className="text-xs text-muted">{hint}</span>}
        </label>
    );
}

type Stage = 'running' | 'waiting' | 'finished';

// Where a campaign stands today: running, waiting (a draft, paused, or starting later), or finished
function stageOf(campaign: Pick<Campaign, 'status' | 'starts_at' | 'ends_at'>, now: number): Stage {
    if (campaign.status === 'ended' || (campaign.ends_at && new Date(campaign.ends_at).getTime() <= now)) return 'finished';
    if (campaign.status === 'active' && !(campaign.starts_at && new Date(campaign.starts_at).getTime() > now)) return 'running';
    return 'waiting';
}

function StatusBadge({ campaign }: { campaign: Pick<Campaign, 'status' | 'ends_at' | 'starts_at'> }) {
    // Read once per mount; render stays pure
    const [now] = useState(() => Date.now());
    const stage = stageOf(campaign, now);
    if (stage === 'running') return <Badge variant="highlight">Running</Badge>;
    if (stage === 'finished') return <Badge>Finished</Badge>;
    if (campaign.status === 'active') return <Badge>Starts {day(campaign.starts_at)}</Badge>;
    return <Badge>{{ draft: 'Draft', paused: 'Paused', ended: 'Finished', active: 'Running' }[campaign.status]}</Badge>;
}

const KindBadge = ({ kind }: { kind: Campaign['kind'] }) => <Badge variant="sponsored">{kind === 'house' ? 'From us' : 'Paid'}</Badge>;

function Tile({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
            {note && <dd className="text-xs text-muted">{note}</dd>}
        </div>
    );
}

// --- Overview ---

type Row = CampaignSummary & { advertiser: Advertiser };

const GROUPS: { stage: Stage; title: string; empty: string }[] = [
    { stage: 'running', title: 'Running now', empty: 'Nothing is running. Start one with the buttons above.' },
    { stage: 'waiting', title: 'Not running yet, or paused', empty: 'No drafts, paused or scheduled campaigns.' },
    { stage: 'finished', title: 'Finished', empty: 'No finished campaigns.' },
];

export function AdminAds({ initial }: { initial: AdsOverview }) {
    const [data, setData] = useState(initial);
    const [view, setView] = useState<'campaigns' | 'advertisers'>('campaigns');
    const [starting, setStarting] = useState<'promote' | 'paid' | null>(null);
    const [now] = useState(() => Date.now());

    async function reload() {
        setData(await api<AdsOverview>('/admin/ads'));
    }

    const rows: Row[] = data.advertisers.flatMap(({ campaigns, ...advertiser }) => campaigns.map((campaign) => ({ ...campaign, advertiser })));
    const running = rows.filter((row) => stageOf(row, now) === 'running');
    const week = rows.reduce(
        (sum, row) => ({ impressions: sum.impressions + (row.last_7_days?.impressions ?? 0), clicks: sum.clicks + (row.last_7_days?.clicks ?? 0) }),
        { impressions: 0, clicks: 0 }
    );

    return (
        <div className="flex flex-col gap-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Ads</h2>
                    <p className="text-sm text-muted">Your own promotions and paid campaigns, shown in feeds and between comments.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setStarting(starting === 'promote' ? null : 'promote')}>
                        <Megaphone className="size-4" /> Promote your own product
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setStarting(starting === 'paid' ? null : 'paid')}>
                        <Plus className="size-4" /> New paid campaign
                    </Button>
                </div>
            </header>
            {starting === 'promote' && <PromoteForm onCancel={() => setStarting(null)} />}
            {starting === 'paid' && <PaidCampaignForm advertisers={data.advertisers} onCancel={() => setStarting(null)} />}

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Tile label="Running now" value={running.length} note={`of ${rows.length} campaign${rows.length === 1 ? '' : 's'}`} />
                <Tile label="Views, last 7 days" value={week.impressions.toLocaleString()} note="Seen on screen, not just loaded" />
                <Tile label="Clicks, last 7 days" value={week.clicks.toLocaleString()} note={`${ctr(week.impressions, week.clicks)} of views`} />
            </dl>

            <div role="tablist" aria-label="Show" className="flex w-fit rounded-lg bg-surface-muted p-0.5 text-sm">
                {(
                    [
                        ['campaigns', `Campaigns (${rows.length})`],
                        ['advertisers', `Advertisers (${data.advertisers.length})`],
                    ] as const
                ).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={view === id}
                        onClick={() => setView(id)}
                        className={twMerge('cursor-pointer rounded-md px-3 py-1.5 font-medium text-muted transition-colors', view === id && 'bg-surface text-text shadow-sm')}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {view === 'campaigns' ? (
                GROUPS.map((group) => {
                    const items = rows.filter((row) => stageOf(row, now) === group.stage);
                    return (
                        <section key={group.stage} className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-muted">
                                {group.title} <span className="tabular-nums">({items.length})</span>
                            </h3>
                            {items.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted">{group.empty}</p>
                            ) : (
                                <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                                    {items.map((row) => (
                                        <CampaignRow key={row.id} row={row} />
                                    ))}
                                </ul>
                            )}
                        </section>
                    );
                })
            ) : (
                <Advertisers advertisers={data.advertisers} onChanged={reload} />
            )}

            <details className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <summary className="cursor-pointer font-semibold">How ad slots are filled</summary>
                <p className="mt-2 text-muted">
                    Each slot goes first to a paid campaign aimed at that community, then to paid campaigns that run everywhere, then to your own
                    (&quot;From us&quot;), then to Google AdSense. Your own promotions with a share of slots get that share even when paid campaigns
                    want them.
                </p>
                <p className="mt-2 text-muted">
                    Google AdSense:{' '}
                    {!data.ads_enabled
                        ? 'all ads are switched off on the server (ADS_ENABLED).'
                        : data.adsense.enabled
                          ? data.adsense.configured
                              ? 'on, filling slots nothing else takes.'
                              : 'switched on, but the ad unit ids are missing.'
                          : 'off. It is turned on in the API settings (ADSENSE_ENABLED and the ADSENSE_* ids).'}
                </p>
            </details>
        </div>
    );
}

function CampaignRow({ row }: { row: Row }) {
    const week = row.last_7_days;
    const places = row.placements ? [row.placements.feed && 'Feed', row.placements.comments && 'Comments'].filter(Boolean).join(' · ') : null;
    return (
        <li>
            <Link href={`/admin?tab=ads&campaign=${row.id}`} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                <Avatar name={row.advertiser.name} src={row.advertiser.logo_url} shape="square" size="lg" className="size-10" />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-semibold">{row.name}</span>
                        <KindBadge kind={row.kind} />
                        <StatusBadge campaign={row} />
                    </div>
                    <p className="truncate text-xs text-muted">
                        {row.advertiser.name} · {row.active_creatives === 0 ? 'no live ads' : (places ?? `${row.active_creatives} live ad${row.active_creatives === 1 ? '' : 's'}`)}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-right text-xs text-muted">
                    <span className="hidden tabular-nums sm:block">
                        <span className="font-semibold text-text">{(week?.impressions ?? row.impressions).toLocaleString()}</span> views ·{' '}
                        <span className="font-semibold text-text">{(week?.clicks ?? row.clicks).toLocaleString()}</span> clicks
                        <span className="block">{week ? 'last 7 days' : 'all time'}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0" />
                </div>
            </Link>
        </li>
    );
}

function Advertisers({ advertisers, onChanged }: { advertisers: AdsOverview['advertisers']; onChanged: () => Promise<void> }) {
    const [adding, setAdding] = useState(false);
    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">The companies (and your own products) whose ads run here. Their logo shows on every one of their ads.</p>
                {!adding && (
                    <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                        <Plus className="size-4" /> Add advertiser
                    </Button>
                )}
            </div>
            {adding && (
                <AdvertiserForm
                    onSaved={async () => {
                        await onChanged();
                        setAdding(false);
                    }}
                    onCancel={() => setAdding(false)}
                />
            )}
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {advertisers.map((advertiser) => (
                    <li key={advertiser.id} className="flex items-center gap-4 px-4 py-3">
                        <LogoUpload advertiser={advertiser} onSaved={onChanged} small />
                        <div className="min-w-0 flex-1 text-sm">
                            <p className="font-semibold">{advertiser.name}</p>
                            <p className="truncate text-xs text-muted">{[advertiser.contact_email, advertiser.website].filter(Boolean).join(' · ') || 'No contact details'}</p>
                        </div>
                        <span className="text-xs text-muted tabular-nums">
                            {advertiser.campaigns.length} campaign{advertiser.campaigns.length === 1 ? '' : 's'}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// The advertiser's logo: the profile picture on every one of its ads. Saved as soon as it's uploaded.
function LogoUpload({ advertiser, onSaved, small = false }: { advertiser: Advertiser; onSaved: () => Promise<void>; small?: boolean }) {
    const [error, setError] = useState<string | null>(null);
    return (
        <div className={twMerge('flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4', small && 'shrink-0')}>
            <ImageUpload
                endpoint="/admin/images?purpose=ad_logo"
                aspect="square"
                label={`${advertiser.name} logo`}
                value={advertiser.logo_url}
                onChange={async (url) => {
                    setError(null);
                    try {
                        await api(`/admin/ads/advertisers/${advertiser.id}`, { method: 'PATCH', body: { logo_url: url } });
                        await onSaved();
                    } catch (error) {
                        setError(errorMessage(error));
                    }
                }}
            />
            {!small && (
                <div className="text-sm">
                    <p className="font-semibold">Logo (the ads&apos; profile picture)</p>
                    <p className="text-muted">
                        Square, 256 × 256 or bigger. Shown next to {advertiser.name} on every one of its ads.{' '}
                        {advertiser.logo_url ? 'Click it to replace it.' : 'Without one, the first letter shows. Click the box to upload.'}
                    </p>
                    {error && <p className="text-xs text-brand-text">{error}</p>}
                </div>
            )}
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
            <Field label="Logo (the ads' profile picture)" hint="Square, 256 × 256 or bigger.">
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
// product, a running house campaign with a share of slots, and its first ad (feed and between comments). Labelled
// "From us" on the site.
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
                <p className="text-sm text-muted">
                    Shows as &quot;From us&quot; in feeds and between comments, even when paid campaigns are running. On the next screen you can
                    adjust the picture and see every place it shows.
                </p>
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
            <Field label="Logo (the ad's profile picture)" hint="Square, 256 × 256 or bigger. Without one, the first letter shows.">
                <ImageUpload endpoint="/admin/images?purpose=ad_logo" aspect="square" label="Logo" value={fields.logo_url || null} onChange={(url) => setFields({ ...fields, logo_url: url ?? '' })} />
            </Field>
            <Field label="Picture (optional)" hint="Best at 1200 × 628. Without one, the link's preview image is used.">
                <ImageUpload endpoint="/admin/images?purpose=ad_image" aspect="card" label="Picture" value={fields.image_url || null} onChange={(url) => setFields({ ...fields, image_url: url ?? '' })} />
            </Field>
            <Field label="Share of ad slots (%)" hint="Up to 50. It gets this share even when paid campaigns want the slots.">
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

// A paid campaign: pick the advertiser (or add one by name) and name the campaign. It starts as a draft; everything
// else is set on its page.
function PaidCampaignForm({ advertisers, onCancel }: { advertisers: Advertiser[]; onCancel: () => void }) {
    const router = useRouter();
    const [advertiserId, setAdvertiserId] = useState(advertisers[0]?.id ?? 'new');
    const [advertiserName, setAdvertiserName] = useState('');
    const [website, setWebsite] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsSaving(true);
        try {
            let id = advertiserId;
            if (id === 'new') {
                const { advertiser } = await api<{ advertiser: Advertiser }>('/admin/ads/advertisers', {
                    method: 'POST',
                    body: { name: advertiserName.trim(), website: website.trim() || null },
                });
                id = advertiser.id;
            }
            const { campaign } = await api<{ campaign: Campaign }>('/admin/ads/campaigns', { method: 'POST', body: { advertiser_id: id, name: name.trim(), kind: 'direct' } });
            router.push(`/admin?tab=ads&campaign=${campaign.id}`);
        } catch (error) {
            setError(errorMessage(error));
            setIsSaving(false);
        }
    }

    const ready = name.trim() && (advertiserId !== 'new' || advertiserName.trim());
    return (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <h3 className="font-bold">New paid campaign</h3>
                <p className="text-sm text-muted">It starts as a draft, so nothing shows until you set it to Running on the next screen.</p>
            </div>
            <Field label="Advertiser">
                <select value={advertiserId} onChange={(e) => setAdvertiserId(e.target.value)} className={selectStyles}>
                    {advertisers.map((advertiser) => (
                        <option key={advertiser.id} value={advertiser.id}>
                            {advertiser.name}
                        </option>
                    ))}
                    <option value="new">New advertiser…</option>
                </select>
            </Field>
            <Field label="Campaign name" hint="Only admins see it.">
                <InputField name="campaign-name" placeholder="November launch" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            {advertiserId === 'new' && (
                <>
                    <Field label="Advertiser name">
                        <InputField name="advertiser-name" placeholder="Company name" required value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)} />
                    </Field>
                    <Field label="Website (optional)">
                        <InputField name="website" type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </Field>
                </>
            )}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="sm:col-span-2" />}
            <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !ready}>
                    Create draft
                </Button>
            </div>
        </form>
    );
}

// --- One campaign, in the order it's set up ---

function Step({ number, title, hint, children }: { number: number; title: string; hint?: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
            <header className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-bold tabular-nums">{number}</span>
                <div>
                    <h3 className="font-bold leading-7">{title}</h3>
                    {hint && <p className="text-sm text-muted">{hint}</p>}
                </div>
            </header>
            <div className="flex flex-col gap-4 sm:pl-10">{children}</div>
        </section>
    );
}

const settingsOf = (campaign: Campaign) => ({
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
type Settings = ReturnType<typeof settingsOf>;

export function AdminCampaign({ initial }: { initial: CampaignDetail }) {
    const [detail, setDetail] = useState(initial);
    const { campaign, advertiser } = detail;
    const [fields, setFields] = useState(() => settingsOf(initial.campaign));
    const [saved, setSaved] = useState(() => settingsOf(initial.campaign));
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [error, setError] = useState<string | null>(null);

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setFields({ ...fields, [key]: value });
        setStatus('idle');
    };
    const dirty = JSON.stringify(fields) !== JSON.stringify(saved);

    async function reload() {
        setDetail(await api<CampaignDetail>(`/admin/ads/campaigns/${campaign.id}`));
    }

    async function save() {
        setStatus('saving');
        setError(null);
        try {
            const { campaign: updated } = await api<{ campaign: Campaign }>(`/admin/ads/campaigns/${campaign.id}`, {
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
            await reload();
            // The API tidies what was typed (community names, for one); show that
            const next = settingsOf(updated);
            setFields(next);
            setSaved(next);
            setStatus('saved');
        } catch (error) {
            setError(errorMessage(error));
            setStatus('idle');
        }
    }

    const totals = detail.creatives.reduce((sum, creative) => ({ impressions: sum.impressions + creative.impressions, clicks: sum.clicks + creative.clicks }), { impressions: 0, clicks: 0 });
    const statsUrl = campaign.stats_token ? `${APP_URL}/ads/stats/${campaign.stats_token}` : null;
    const paid = fields.kind === 'direct';
    const runsEverywhere = !fields.communities.trim() && fields.categories.length === 0;
    let step = 0;

    return (
        <div className="flex flex-col gap-4">
            <Link href="/admin?tab=ads" className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                <ArrowLeft className="size-4" /> All campaigns
            </Link>
            <header className="flex items-center gap-3">
                <Avatar name={advertiser.name} src={advertiser.logo_url} shape="square" size="lg" className="size-12" />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-bold">{campaign.name}</h2>
                        <KindBadge kind={campaign.kind} />
                        <StatusBadge campaign={campaign} />
                    </div>
                    <p className="text-sm text-muted">for {advertiser.name}</p>
                </div>
            </header>

            <Step number={++step} title="Basics" hint="Who it's for, what it's called and whether it's on.">
                <LogoUpload advertiser={advertiser} onSaved={reload} />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Campaign name" hint="Only admins see it.">
                        <InputField name="campaign-name" required value={fields.name} onChange={(e) => set('name', e.target.value)} />
                    </Field>
                    <Field label="Status" hint="Only Running shows ads, between the dates in step 3 if you set any.">
                        <select value={fields.status} onChange={(e) => set('status', e.target.value as Campaign['status'])} className={selectStyles}>
                            <option value="draft">Draft (not shown yet)</option>
                            <option value="active">Running</option>
                            <option value="paused">Paused</option>
                            <option value="ended">Finished</option>
                        </select>
                    </Field>
                </div>
            </Step>

            <Step number={++step} title="Ads" hint="What people see. Each ad can run in the feed, between comments, or both; the previews show exactly how.">
                <Creatives campaign={campaign} advertiser={advertiser} creatives={detail.creatives} onChanged={reload} />
            </Step>

            <Step number={++step} title="Where and when" hint="Leave everything empty to run everywhere ads are allowed, with no end date.">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Starts" hint="Empty: as soon as it's Running.">
                        <InputField name="starts_at" type="date" value={fields.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
                    </Field>
                    <Field label="Ends" hint="Empty: until you stop it.">
                        <InputField name="ends_at" type="date" value={fields.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
                    </Field>
                </div>
                <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-sm font-semibold">Communities and topics</legend>
                    <InputField
                        name="communities"
                        aria-label="Communities"
                        placeholder="Communities, separated by commas (e.g. lagosrent, naijatech)"
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
                            ? 'Nothing picked: shows on the home feed and in every community that carries ads.'
                            : 'Shows only in these communities and topics (not on the home feed).'}
                    </p>
                </fieldset>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Times one person sees it a day" hint="Empty: no limit. 3 is a good default.">
                        <InputField name="frequency_cap" type="number" min={1} max={100} placeholder="No limit" value={fields.frequency_cap} onChange={(e) => set('frequency_cap', e.target.value)} />
                    </Field>
                    {!paid && (
                        <Field label="Share of ad slots (%)" hint="0: only slots nobody paid for. Up to 50: gets that share even when paid campaigns want it.">
                            <InputField name="house_share" type="number" min={0} max={50} value={fields.house_share} onChange={(e) => set('house_share', e.target.value)} />
                        </Field>
                    )}
                </div>
                <details className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                    <summary className="cursor-pointer font-semibold">Advanced</summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Order among paid campaigns" hint="When two paid campaigns want the same slot, the higher number goes first. Leave at 0 unless a deal says otherwise.">
                            <InputField name="priority" type="number" min={-100} max={100} value={fields.priority} onChange={(e) => set('priority', e.target.value)} />
                        </Field>
                        <Field label="Type" hint="From us: your own promotions, no billing. Paid: an advertiser's campaign.">
                            <select value={fields.kind} onChange={(e) => set('kind', e.target.value as Campaign['kind'])} className={selectStyles}>
                                <option value="direct">Paid</option>
                                <option value="house">From us</option>
                            </select>
                        </Field>
                    </div>
                </details>
            </Step>

            {paid && (
                <Step number={++step} title="Billing" hint="For your records and the advertiser's payment. Nothing here changes what shows, except a per-view budget running out.">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="How it's priced">
                            <select value={fields.pricing_model} onChange={(e) => set('pricing_model', e.target.value as Campaign['pricing_model'])} className={selectStyles}>
                                <option value="flat">Flat fee</option>
                                <option value="cpm">Per 1,000 views</option>
                            </select>
                        </Field>
                        <Field label={fields.pricing_model === 'cpm' ? 'Price per 1,000 views' : 'Fee'}>
                            <InputField name="price" type="number" min={0} step="0.01" value={fields.price} onChange={(e) => set('price', e.target.value)} />
                        </Field>
                        <Field label="Currency">
                            <InputField name="currency" maxLength={3} value={fields.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} />
                        </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Budget" hint={fields.pricing_model === 'cpm' ? 'Stops showing once it is spent.' : 'For your records only.'}>
                            <InputField name="budget" type="number" min={0} step="0.01" placeholder="None" value={fields.budget} onChange={(e) => set('budget', e.target.value)} />
                        </Field>
                        <Field label="Payment link (Paystack)" hint="Send it to the advertiser to pay.">
                            <InputField name="payment_url" type="url" placeholder="https://paystack.com/pay/..." value={fields.payment_url} onChange={(e) => set('payment_url', e.target.value)} />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={fields.paid} onChange={(e) => set('paid', e.target.checked)} className="size-4 accent-current" />
                        Paid {campaign.paid_at && <span className="text-muted">(marked {day(campaign.paid_at)})</span>}
                    </label>
                    {campaign.pricing_model === 'cpm' && (
                        <p className="text-sm text-muted">
                            Spent so far: {money(campaign.spent_minor, campaign.currency)} of {money(campaign.budget_minor, campaign.currency)}
                        </p>
                    )}
                </Step>
            )}

            <Step number={++step} title="Results" hint="Views count only when at least half the ad was on screen for a second.">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Tile label="Views" value={totals.impressions.toLocaleString()} note="All time" />
                    <Tile label="Clicks" value={totals.clicks.toLocaleString()} note="All time" />
                    <Tile label="Click rate" value={ctr(totals.impressions, totals.clicks)} note="Clicks per view" />
                </dl>
                {statsUrl && campaign.kind === 'direct' && <ShareStats url={statsUrl} />}
                {detail.days.length === 0 ? (
                    <p className="text-sm text-muted">No views in the last 30 days.</p>
                ) : (
                    <table className="w-full rounded-xl border border-border text-sm">
                        <caption className="pb-2 text-left text-sm font-semibold">Last 30 days</caption>
                        <thead className="text-left text-xs text-muted">
                            <tr>
                                <th className="px-3 py-2 font-semibold">Day</th>
                                <th className="px-3 py-2 text-right font-semibold">Views</th>
                                <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                                <th className="px-3 py-2 text-right font-semibold">Click rate</th>
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
            </Step>

            {/* One save for the campaign's settings (steps 1, 3 and billing), always in the same place at the bottom of the
                screen. Ads save on their own, with their own button. */}
            <div className="sticky bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border md:bottom-4">
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" className="mr-auto" />}
                <span className="text-sm text-muted" aria-live="polite">
                    {dirty ? 'Unsaved changes' : status === 'saved' ? 'Saved' : 'All changes saved'}
                </span>
                <Button onClick={save} disabled={!dirty || status === 'saving' || !fields.name.trim()}>
                    {status === 'saving' ? 'Saving...' : 'Save changes'}
                </Button>
            </div>
        </div>
    );
}

function ShareStats({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm">
            <span className="text-muted">The advertiser&apos;s own results page:</span>
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
        <div className="flex flex-col gap-3">
            {!isAdding && (
                <Button size="sm" variant="secondary" className="self-start" onClick={() => setIsAdding(true)}>
                    <Plus className="size-4" /> New ad
                </Button>
            )}
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
        </div>
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
