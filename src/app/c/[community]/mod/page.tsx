import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { ArrowLeft, CloudOff, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { CommunityResponse, FlairsResponse, JoinRequest, ModLogResponse, QueueResponse, RestrictionsResponse, TeamResponse, UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import QueueList from '@/components/moderation/QueueList';
import ModLog from '@/components/moderation/ModLog';
import RestrictionsPanel from '@/components/moderation/RestrictionsPanel';
import CommunitySettingsForm from '@/components/moderation/CommunitySettingsForm';
import ToolTabs from '@/components/moderation/ToolTabs';
import ManageFlairs from '@/components/community/ManageFlairs';
import JoinRequests from '@/components/moderation/JoinRequests';
import TeamPanel from '@/components/moderation/TeamPanel';

export const metadata = { title: `Mod tools | ${APP_NAME}`, robots: { index: false } };

type PageProps = { params: Promise<{ community: string }>; searchParams: Promise<{ tab?: string }> };

const TABS = ['queue', 'requests', 'team', 'people', 'log', 'settings'] as const;
// Posts-only moderators have the queue and the log
const POSTS_ONLY_TABS: readonly Tab[] = ['queue', 'team', 'log'];
type Tab = (typeof TABS)[number];

export default async function ModToolsPage({ params, searchParams }: PageProps) {
    const { community: name } = await params;
    const { tab: tabParam } = await searchParams;
    const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'queue';
    const base = `/communities/${encodeURIComponent(name)}`;

    const [community, me] = await Promise.all([serverApi<CommunityResponse>(base), serverApi<UserResponse>('/auth/me')]);
    if (community.status === 404) notFound();
    if (community.data && name !== community.data.community.name) permanentRedirect(`/c/${community.data.community.name}/mod`);
    if (!community.data) return <EmptyState icon={<CloudOff />} title="Couldn't load this community" description="Try again in a moment." />;

    const role = community.data.viewer?.role;
    const canModerate = role === 'owner' || role === 'moderator' || me.data?.user.role === 'admin';
    if (!canModerate) {
        return <EmptyState icon={<ShieldCheck />} title="Moderators only" description="These tools are for this community's moderators." />;
    }

    const { community: info, viewer } = community.data;
    const isPostsOnly = viewer?.mod_permission === 'posts';
    const allowed = (id: Tab) => !isPostsOnly || POSTS_ONLY_TABS.includes(id);
    const [queue, restrictions, log, requests, team, flairs] = await Promise.all([
        tab === 'queue' ? serverApi<QueueResponse>(`${base}/mod-queue`) : null,
        tab === 'people' ? serverApi<RestrictionsResponse>(`${base}/restrictions`) : null,
        tab === 'log' ? serverApi<ModLogResponse>(`${base}/mod-log`) : null,
        allowed('requests') ? serverApi<{ requests: JoinRequest[] }>(`${base}/join-requests`) : null,
        tab === 'team' ? serverApi<TeamResponse>(`${base}/team`) : null,
        tab === 'settings' ? serverApi<FlairsResponse>(`${base}/flairs`) : null,
    ]);
    if (!allowed(tab)) redirect(`/c/${info.name}/mod`);
    const failed =
        (tab === 'queue' && !queue?.data) ||
        (tab === 'people' && !restrictions?.data) ||
        (tab === 'log' && !log?.data) ||
        (tab === 'requests' && !requests?.data) ||
        (tab === 'team' && !team?.data);

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-col gap-1 px-4 sm:px-0">
                <Link href={`/c/${info.name}`} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                    <ArrowLeft className="size-4" /> {info.name}
                </Link>
                <h1 className="text-2xl font-extrabold">Mod tools</h1>
            </div>
            <ToolTabs
                basePath={`/c/${info.name}/mod`}
                current={tab}
                tabs={[
                    { id: 'queue' as const, label: 'Queue', count: viewer?.queue_count },
                    { id: 'requests' as const, label: 'Join requests', count: requests?.data?.requests.length },
                    { id: 'team' as const, label: 'Moderators' },
                    { id: 'people' as const, label: 'Bans and mutes' },
                    { id: 'log' as const, label: 'Mod log' },
                    { id: 'settings' as const, label: 'About and rules' },
                ].filter(({ id }) => allowed(id))}
            />
            <div className="px-4 sm:px-0">
                {failed ? (
                    <EmptyState icon={<CloudOff />} title="Couldn't load this section" description="Try again in a moment." />
                ) : tab === 'queue' ? (
                    <QueueList initialItems={queue!.data!.items} />
                ) : tab === 'requests' ? (
                    <JoinRequests community={info.name} initial={requests!.data!.requests} />
                ) : tab === 'team' ? (
                    <TeamPanel community={info.name} initial={team!.data!} viewerRole={viewer?.role ?? null} viewerPermission={viewer?.mod_permission ?? null} viewerName={me.data?.user.username ?? ''} />
                ) : tab === 'people' ? (
                    <RestrictionsPanel community={info.name} initial={restrictions!.data!} />
                ) : tab === 'log' ? (
                    <ModLog path={`${base}/mod-log`} initial={log!.data!} />
                ) : (
                    <div className="flex flex-col gap-4">
                        <CommunitySettingsForm community={info} />
                        <ManageFlairs community={info.name} initialFlairs={flairs?.data?.flairs ?? []} />
                    </div>
                )}
            </div>
        </div>
    );
}
