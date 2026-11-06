import { redirect } from 'next/navigation';
import { CloudOff } from 'lucide-react';
import { staffApi } from '@/lib/api/server';
import Link from 'next/link';
import { AdminCommunity, AdminOverview, AdminUsersResponse, BlockedTerm, ModLogResponse, QueueResponse, StaffAccount, StaffAuditEntry, StaffRole } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import QueueList from '@/components/moderation/QueueList';
import ModLog from '@/components/moderation/ModLog';
import ToolTabs from '@/components/moderation/ToolTabs';
import AlertEmailToggle from './_components/AlertEmailToggle';
import ErrorTest from './_components/ErrorTest';
import { AdminCommunities, AdminUsers, Blocklist } from './_components/AdminPanels';
import { AdminAds, AdminCampaign } from './_components/AdminAds';
import type { AdsOverview, CampaignDetail } from '@/ads/types';
import { AdminStats } from './_components/AdminStats';
import { AdminStaff, AuditLog, StaffBar } from './_components/AdminStaff';
import { SeedAccount, SeedPost } from './_components/SeedPost';
import type { AdminStatsResponse } from '@/types/api';


type PageProps = { searchParams: Promise<{ tab?: string; campaign?: string; days?: string; from?: string; to?: string; filter?: string }> };

const USER_FILTERS = ['all', 'new', 'suspended', 'shadow_banned'];

const TABS = ['queue', 'reports', 'stats', 'users', 'communities', 'post', 'ads', 'blocklist', 'log', 'admins', 'audit'] as const;
type Tab = (typeof TABS)[number];

// What each staff role sees (the API enforces the same)
const ROLE_TABS: Record<StaffRole, Tab[]> = {
    owner: [...TABS],
    admin: ['queue', 'reports', 'stats', 'users', 'communities', 'post', 'ads', 'blocklist', 'log', 'audit'],
    moderator: ['queue', 'reports', 'users', 'communities', 'blocklist', 'log'],
    ads: ['ads', 'stats'],
};
const LABELS: Record<Tab, string> = {
    queue: 'Queue',
    reports: 'All reports',
    stats: 'Stats',
    users: 'Users',
    communities: 'Communities',
    post: 'Post as',
    ads: 'Ads',
    blocklist: 'Blocklist',
    log: 'Log',
    admins: 'Admins',
    audit: 'Audit',
};

// Staff accounts only, signed in at /admin/login (a forum account gives no access here)
export default async function AdminPage({ searchParams }: PageProps) {
    const me = await staffApi<{ staff: StaffAccount }>('/admin/auth/me');
    // Only "not signed in" goes to the sign-in page; any other failure (the API down, a hiccup) says so instead of
    // looking like a sign-out
    if (me.status === 401 || me.data?.staff.password_change_required) redirect('/admin/login');
    if (!me.data) {
        return <EmptyState icon={<CloudOff />} title="Couldn't reach the admin panel" description="Your session is fine. Try again in a moment." />;
    }
    const staff = me.data.staff;
    const allowed = ROLE_TABS[staff.role];

    const { tab: tabParam, campaign, days: daysParam, from, to, filter: filterParam } = await searchParams;
    const userFilter = USER_FILTERS.includes(filterParam ?? '') ? filterParam! : 'all';
    const tab: Tab = allowed.includes(tabParam as Tab) ? (tabParam as Tab) : allowed[0];
    // Stats range: ?days=7|30|90 (default 30) or ?from=&to= (YYYY-MM-DD)
    const isDay = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');
    const days = isDay(from) ? null : [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;
    const statsQuery = new URLSearchParams(days ? { days: String(days) } : { from: from!, ...(isDay(to) ? { to: to! } : {}) });

    const [overview, section, postCommunities] = await Promise.all([
        staffApi<AdminOverview>('/admin/overview'),
        staffApi<unknown>(
            {
                queue: '/admin/queue',
                reports: '/admin/queue?view=reports',
                stats: `/admin/stats?${statsQuery}`,
                users: `/admin/users?filter=${userFilter}`,
                communities: '/admin/communities',
                post: '/admin/seed-accounts',
                ads: campaign ? `/admin/ads/campaigns/${encodeURIComponent(campaign)}` : '/admin/ads',
                blocklist: '/admin/blocklist',
                log: '/admin/mod-log',
                admins: '/admin/staff',
                audit: '/admin/audit',
            }[tab]
        ),
        // Post as needs the communities too
        tab === 'post' ? staffApi<{ communities: AdminCommunity[] }>('/admin/communities') : null,
    ]);
    const stats = overview.data;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-0">
                <h1 className="text-2xl font-extrabold">Admin</h1>
                <StaffBar staff={staff} />
            </div>
            {stats && (
                <dl className="grid grid-cols-2 gap-2 px-4 text-sm sm:grid-cols-4 sm:px-0">
                    {[
                        ['Waiting for review', stats.queue],
                        ['New accounts (24 h)', stats.new_users_24h],
                        ['Posts (24 h)', stats.posts_24h],
                        ['Comments (24 h)', stats.comments_24h],
                        ['Accounts', stats.users],
                        ['Suspended', stats.suspended, 'suspended'],
                        ['Shadow-banned', stats.shadow_banned, 'shadow_banned'],
                    ].map(([label, value, filter]) => {
                        const body = (
                            <>
                                <dt className="text-xs text-muted">{label}</dt>
                                <dd className="text-lg font-bold tabular-nums">{value}</dd>
                            </>
                        );
                        // The ban counts open the matching list on the Users tab
                        return filter && allowed.includes('users') ? (
                            <Link
                                key={label}
                                href={`/admin?tab=users&filter=${filter}`}
                                className="rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:border-border-strong"
                            >
                                {body}
                            </Link>
                        ) : (
                            <div key={label} className="rounded-xl border border-border bg-surface px-3 py-2">
                                {body}
                            </div>
                        );
                    })}
                </dl>
            )}
            <ToolTabs
                basePath="/admin"
                current={tab}
                tabs={allowed.map((id) => ({ id, label: LABELS[id], count: id === 'queue' ? stats?.queue : undefined }))}
            />
            <div className="px-4 sm:px-0">
                {!section.data ? (
                    <EmptyState icon={<CloudOff />} title="Couldn't load this section" description="Try again in a moment." />
                ) : tab === 'queue' ? (
                    <>
                        {(staff.role === 'owner' || staff.role === 'admin') && <AlertEmailToggle initial={staff.alert_email} />}
                        <p className="mb-3 text-sm text-muted">
                            Site-rule reports, reports moderators sent to you, reports about accounts, communities and ads, and held
                            content. Community-rule reports are in All reports.
                        </p>
                        <QueueList initialItems={(section.data as QueueResponse).items} site />
                    </>
                ) : tab === 'reports' ? (
                    <>
                        <p className="mb-3 text-sm text-muted">
                            Every open report in every community, including community-rule reports that the community&apos;s moderators
                            handle. Acting here settles it for them too.
                        </p>
                        <QueueList initialItems={(section.data as QueueResponse).items} site emptyDescription="No open reports anywhere." />
                    </>
                ) : tab === 'stats' ? (
                    <AdminStats data={section.data as AdminStatsResponse} days={days} />
                ) : tab === 'users' ? (
                    <AdminUsers
                        key={userFilter}
                        initial={section.data as AdminUsersResponse}
                        initialFilter={userFilter}
                        canTrust={staff.role === 'owner' || staff.role === 'admin'}
                    />
                ) : tab === 'communities' ? (
                    <AdminCommunities initialCommunities={(section.data as { communities: AdminCommunity[] }).communities} />
                ) : tab === 'post' ? (
                    <SeedPost accounts={(section.data as { accounts: SeedAccount[] }).accounts} communities={postCommunities?.data?.communities ?? []} />
                ) : tab === 'ads' ? (
                    campaign ? (
                        <AdminCampaign key={campaign} initial={section.data as CampaignDetail} />
                    ) : (
                        <AdminAds initial={section.data as AdsOverview} />
                    )
                ) : tab === 'blocklist' ? (
                    <Blocklist initialTerms={(section.data as { terms: BlockedTerm[] }).terms} />
                ) : tab === 'admins' ? (
                    <>
                        <AdminStaff me={staff} initial={(section.data as { staff: StaffAccount[] }).staff} />
                        <ErrorTest />
                    </>
                ) : tab === 'audit' ? (
                    <AuditLog initial={section.data as { entries: StaffAuditEntry[]; next_cursor: string | null }} />
                ) : (
                    <ModLog path="/admin/mod-log" initial={section.data as ModLogResponse} />
                )}
            </div>
        </div>
    );
}
