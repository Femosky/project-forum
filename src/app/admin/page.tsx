import { notFound } from 'next/navigation';
import { CloudOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { AdminCommunity, AdminOverview, AdminUser, BlockedTerm, ModLogResponse, QueueResponse, UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import QueueList from '@/components/moderation/QueueList';
import ModLog from '@/components/moderation/ModLog';
import ToolTabs from '@/components/moderation/ToolTabs';
import { AdminCommunities, AdminUsers, Blocklist } from './_components/AdminPanels';
import { AdminAds, AdminCampaign } from './_components/AdminAds';
import type { AdsOverview, CampaignDetail } from '@/ads/types';

export const metadata = { title: `Admin | ${APP_NAME}`, robots: { index: false } };

type PageProps = { searchParams: Promise<{ tab?: string; campaign?: string }> };

const TABS = ['queue', 'users', 'communities', 'ads', 'blocklist', 'log'] as const;
type Tab = (typeof TABS)[number];

// Site admins only. Everyone else gets a plain 404, so the page doesn't advertise itself.
export default async function AdminPage({ searchParams }: PageProps) {
    const me = await serverApi<UserResponse>('/auth/me');
    if (me.data?.user.role !== 'admin') notFound();

    const { tab: tabParam, campaign } = await searchParams;
    const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'queue';

    const [overview, section] = await Promise.all([
        serverApi<AdminOverview>('/admin/overview'),
        serverApi<unknown>(
            {
                queue: '/admin/queue',
                users: '/admin/users',
                communities: '/admin/communities',
                ads: campaign ? `/admin/ads/campaigns/${encodeURIComponent(campaign)}` : '/admin/ads',
                blocklist: '/admin/blocklist',
                log: '/admin/mod-log',
            }[tab]
        ),
    ]);
    const stats = overview.data;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Admin</h1>
            {stats && (
                <dl className="grid grid-cols-2 gap-2 px-4 text-sm sm:grid-cols-4 sm:px-0">
                    {[
                        ['Waiting for review', stats.queue],
                        ['New accounts (24 h)', stats.new_users_24h],
                        ['Posts (24 h)', stats.posts_24h],
                        ['Comments (24 h)', stats.comments_24h],
                        ['Accounts', stats.users],
                        ['Suspended', stats.suspended],
                        ['Shadow-banned', stats.shadow_banned],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-border bg-surface px-3 py-2">
                            <dt className="text-xs text-muted">{label}</dt>
                            <dd className="text-lg font-bold tabular-nums">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <ToolTabs
                basePath="/admin"
                current={tab}
                tabs={[
                    { id: 'queue', label: 'Queue', count: stats?.queue },
                    { id: 'users', label: 'Users' },
                    { id: 'communities', label: 'Communities' },
                    { id: 'ads', label: 'Ads' },
                    { id: 'blocklist', label: 'Blocklist' },
                    { id: 'log', label: 'Log' },
                ]}
            />
            <div className="px-4 sm:px-0">
                {!section.data ? (
                    <EmptyState icon={<CloudOff />} title="Couldn't load this section" description="Try again in a moment." />
                ) : tab === 'queue' ? (
                    <QueueList initialItems={(section.data as QueueResponse).items} site />
                ) : tab === 'users' ? (
                    <AdminUsers initialUsers={(section.data as { users: AdminUser[] }).users} />
                ) : tab === 'communities' ? (
                    <AdminCommunities initialCommunities={(section.data as { communities: AdminCommunity[] }).communities} />
                ) : tab === 'ads' ? (
                    campaign ? (
                        <AdminCampaign key={campaign} initial={section.data as CampaignDetail} />
                    ) : (
                        <AdminAds initial={section.data as AdsOverview} />
                    )
                ) : tab === 'blocklist' ? (
                    <Blocklist initialTerms={(section.data as { terms: BlockedTerm[] }).terms} />
                ) : (
                    <ModLog path="/admin/mod-log" initial={section.data as ModLogResponse} />
                )}
            </div>
        </div>
    );
}
