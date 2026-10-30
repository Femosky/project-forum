import Link from 'next/link';
import { CloudOff, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { serverApi } from '@/lib/api/server';
import { communityLabel } from '@/lib/communityName';
import { APP_NAME } from '@/lib/constants';
import { ModerationOverview } from '@/types/api';
import { EmailChoice, InviteAnswer } from './_components/ModerationActions';

export const metadata = { title: `Moderation | ${APP_NAME}`, robots: { index: false } };

// Everything the signed-in person moderates, in one place
export default async function ModerationPage() {
    const { data, status } = await serverApi<ModerationOverview>('/moderation/overview');

    if (status === 401) {
        return (
            <EmptyState
                icon={<ShieldCheck />}
                title="Sign in to see your communities"
                action={
                    <Button asChild>
                        <Link href="/auth/login?next=/moderation">Log in</Link>
                    </Button>
                }
            />
        );
    }
    if (!data) return <EmptyState icon={<CloudOff />} title="Couldn't load this page" description="Try again in a moment." />;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Moderation</h1>

            {data.invites.length > 0 && (
                <ul className="flex flex-col divide-y divide-border bg-surface sm:rounded-xl sm:border sm:border-border">
                    {data.invites.map((invite) => (
                        <li key={invite.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <p className="min-w-0 flex-1 text-sm">
                                <span className="font-bold">{invite.inviter.username}</span> invited you to moderate{' '}
                                <Link href={`/c/${invite.community.name}`} className="font-bold hover:underline">
                                    {communityLabel(invite.community)}
                                </Link>
                                {invite.permission === 'posts' ? ' (posts only)' : ''}
                            </p>
                            <InviteAnswer id={invite.id} />
                        </li>
                    ))}
                </ul>
            )}

            {data.communities.length === 0 && data.invites.length === 0 ? (
                <EmptyState icon={<ShieldCheck />} title="You don't moderate a community yet" description="Communities you own or help run will show up here." />
            ) : (
                <ul className="flex flex-col gap-3 sm:px-0">
                    {data.communities.map((community) => {
                        const mod = `/c/${community.name}/mod`;
                        return (
                            <li key={community.name} className="flex flex-col gap-3 border-y border-border bg-surface px-4 py-4 sm:rounded-xl sm:border">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link href={`/c/${community.name}`} className="font-bold hover:underline">
                                        {communityLabel(community)}
                                    </Link>
                                    <span className="rounded-full bg-active px-2 text-xs font-semibold leading-5 text-muted">
                                        {community.role === 'owner' ? 'Owner' : community.permission === 'posts' ? 'Mod, posts only' : 'Mod'}
                                    </span>
                                    {community.visibility === 'private' && <span className="text-xs text-muted">Private</span>}
                                    <Link href={mod} className="ml-auto text-sm font-semibold text-link hover:underline">
                                        Mod tools
                                    </Link>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <Link href={`${mod}?tab=queue`} className="rounded-[7px] px-3 py-1.5 ring-1 ring-inset ring-border hover:bg-hover">
                                        <span className="font-bold tabular-nums">{community.queue}</span> in the queue
                                    </Link>
                                    {community.permission === 'all' && (
                                        <Link href={`${mod}?tab=requests`} className="rounded-[7px] px-3 py-1.5 ring-1 ring-inset ring-border hover:bg-hover">
                                            <span className="font-bold tabular-nums">{community.join_requests}</span> asking to join
                                        </Link>
                                    )}
                                    <Link href={`${mod}?tab=team`} className="rounded-[7px] px-3 py-1.5 ring-1 ring-inset ring-border hover:bg-hover">
                                        Moderators
                                    </Link>
                                </div>
                                <EmailChoice community={community.name} initial={community.email} />
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
