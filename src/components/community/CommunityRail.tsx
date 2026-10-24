import Link from 'next/link';
import { CalendarDays, ChevronDown, ScrollText, ShieldCheck, Tag } from 'lucide-react';
import { CommunityResponse } from '@/types/api';
import Avatar from '@/components/ui/Avatar';
import { categoryLabel } from '@/lib/moderation';

const cardClasses = 'flex flex-col gap-3 border-b border-border bg-surface px-4 py-4 sm:rounded-xl sm:border';

// About, rules and moderators: the right rail on wide screens, below the header on small ones (moderators are
// listed in the rail only).
// Rendered on the server so crawlers and no-JS readers get the rules too.
export function CommunityRail({ data }: { data: CommunityResponse }) {
    const { community, moderators, viewer } = data;
    const rules = community.rules ?? [];
    const category = categoryLabel(community.category);
    const isModerator = viewer?.role === 'owner' || viewer?.role === 'moderator';

    return (
        <aside aria-label={`About c/${community.name}`} className="flex flex-col gap-3">
            {isModerator && (
                // Plain <a>: client navigation to /mod would be read as a post by the split view's reader route
                <a
                    href={`/c/${community.name}/mod`}
                    className="flex items-center gap-2 border-b border-border bg-highlight px-4 py-3 text-sm font-semibold text-highlight-fg sm:rounded-xl sm:border-0"
                >
                    <ShieldCheck className="size-4" /> Mod tools
                    {viewer?.queue_count ? (
                        <span className="ml-auto rounded-full bg-danger px-2 text-xs text-surface tabular-nums">{viewer.queue_count} waiting</span>
                    ) : null}
                </a>
            )}

            <section className={cardClasses}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted">About</h2>
                {community.description && <p className="text-sm">{community.description}</p>}
                <ul className="flex flex-col gap-1.5 text-sm text-muted">
                    <li className="flex items-center gap-2">
                        <CalendarDays className="size-4" /> Created {new Date(community.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </li>
                    {category && (
                        <li className="flex items-center gap-2">
                            <Tag className="size-4" />
                            <Link href={`/communities?category=${community.category}`} className="hover:underline">
                                {category}
                            </Link>
                        </li>
                    )}
                </ul>
                {viewer?.muted_until && (
                    <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                        You&apos;re muted here until {new Date(viewer.muted_until).toLocaleString()}. You can read, but not post or comment.
                    </p>
                )}
            </section>

            {rules.length > 0 && (
                // Collapsed on small screens so the posts stay near the top; always open in the wide-screen rail
                // (::details-content). Either way the rules are in the HTML for crawlers and no-JS readers.
                <details className="group/rules border-b border-border bg-surface px-4 py-4 sm:rounded-xl sm:border xl:[&::details-content]:[content-visibility:visible]">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted xl:pointer-events-none">
                        <ScrollText className="size-4" /> Rules <span className="font-normal normal-case xl:hidden">({rules.length})</span>
                        <ChevronDown className="ml-auto size-4 transition-transform group-open/rules:rotate-180 xl:hidden" />
                    </summary>
                    <ol className="mt-3 flex flex-col divide-y divide-border">
                        {rules.map((rule, index) => (
                            <li key={index} className="flex flex-col gap-0.5 py-2 text-sm">
                                <p className="flex gap-2 font-semibold">
                                    <span className="text-muted">{index + 1}.</span> {rule.title}
                                </p>
                                {rule.description && <p className="pl-5 text-muted">{rule.description}</p>}
                            </li>
                        ))}
                    </ol>
                    <p className="mt-2 text-xs text-muted">
                        Site-wide rules apply too: see the{' '}
                        <Link href="/policies/content" className="text-link hover:underline">
                            content policy
                        </Link>
                        .
                    </p>
                </details>
            )}

            {moderators.length > 0 && (
                <section className={`hidden xl:flex ${cardClasses}`}>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Moderators</h2>
                    <ul className="flex flex-col gap-2">
                        {moderators.map((moderator) => (
                            <li key={moderator.username}>
                                <Link href={`/u/${moderator.username}`} className="flex items-center gap-2 text-sm hover:underline">
                                    <Avatar name={moderator.username} size="sm" />
                                    <span className="truncate font-semibold">u/{moderator.username}</span>
                                    {moderator.role === 'owner' && <span className="text-xs text-muted">owner</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </aside>
    );
}

export default CommunityRail;
