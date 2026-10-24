import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CloudOff, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommunityResponse, ModLogResponse, QueueResponse, RestrictionsResponse, UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import QueueList from '@/components/moderation/QueueList';
import ModLog from '@/components/moderation/ModLog';
import RestrictionsPanel from '@/components/moderation/RestrictionsPanel';
import CommunitySettingsForm from '@/components/moderation/CommunitySettingsForm';
import ToolTabs from '@/components/moderation/ToolTabs';

export const metadata = { title: `Mod tools | ${APP_NAME}`, robots: { index: false } };

type PageProps = { params: Promise<{ community: string }>; searchParams: Promise<{ tab?: string }> };

const TABS = ['queue', 'people', 'log', 'settings'] as const;
type Tab = (typeof TABS)[number];

export default async function ModToolsPage({ params, searchParams }: PageProps) {
    const { community: name } = await params;
    const { tab: tabParam } = await searchParams;
    const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'queue';
    const base = `/communities/${encodeURIComponent(name)}`;

    const [community, me] = await Promise.all([serverApi<CommunityResponse>(base), serverApi<UserResponse>('/auth/me')]);
    if (community.status === 404) notFound();
    if (!community.data) return <EmptyState icon={<CloudOff />} title="Couldn't load this community" description="Try again in a moment." />;

    const role = community.data.viewer?.role;
    const canModerate = role === 'owner' || role === 'moderator' || me.data?.user.role === 'admin';
    if (!canModerate) {
        return <EmptyState icon={<ShieldCheck />} title="Moderators only" description="These tools are for this community's moderators." />;
    }

    const { community: info, viewer } = community.data;
    const [queue, restrictions, log] = await Promise.all([
        tab === 'queue' ? serverApi<QueueResponse>(`${base}/mod-queue`) : null,
        tab === 'people' ? serverApi<RestrictionsResponse>(`${base}/restrictions`) : null,
        tab === 'log' ? serverApi<ModLogResponse>(`${base}/mod-log`) : null,
    ]);
    const failed = (tab === 'queue' && !queue?.data) || (tab === 'people' && !restrictions?.data) || (tab === 'log' && !log?.data);

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-col gap-1 px-4 sm:px-0">
                <Link href={`/c/${info.name}`} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                    <ArrowLeft className="size-4" /> c/{info.name}
                </Link>
                <h1 className="text-2xl font-extrabold">Mod tools</h1>
            </div>
            <ToolTabs
                basePath={`/c/${info.name}/mod`}
                current={tab}
                tabs={[
                    { id: 'queue', label: 'Queue', count: viewer?.queue_count },
                    { id: 'people', label: 'Bans and mutes' },
                    { id: 'log', label: 'Mod log' },
                    { id: 'settings', label: 'About and rules' },
                ]}
            />
            <div className="px-4 sm:px-0">
                {failed ? (
                    <EmptyState icon={<CloudOff />} title="Couldn't load this section" description="Try again in a moment." />
                ) : tab === 'queue' ? (
                    <QueueList initialItems={queue!.data!.items} />
                ) : tab === 'people' ? (
                    <RestrictionsPanel community={info.name} initial={restrictions!.data!} />
                ) : tab === 'log' ? (
                    <ModLog path={`${base}/mod-log`} initial={log!.data!} />
                ) : (
                    <CommunitySettingsForm community={info} />
                )}
            </div>
        </div>
    );
}
