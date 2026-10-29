import Link from 'next/link';
import { TrendingTopic } from '@/types/api';
import { communityLabel } from '@/lib/communityName';

// Where a topic leads: a search for the term, or for a flair inside its community
export function topicHref(topic: TrendingTopic) {
    return `/search?${new URLSearchParams({ q: topic.term, ...(topic.kind === 'flair' && topic.community ? { community: topic.community } : {}) })}`;
}

// Topics as a row of quiet chips. Server-rendered: plain links, no JavaScript.
export function TrendingTopics({ topics, className }: { topics: TrendingTopic[]; className?: string }) {
    if (topics.length === 0) return null;
    return (
        <ul className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
            {topics.map((topic) => (
                <li key={`${topic.kind}:${topic.community ?? ''}:${topic.term}`}>
                    <Link
                        href={topicHref(topic)}
                        title={`${topic.posts} posts from ${topic.authors} people`}
                        className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-text ring-1 ring-inset ring-border-strong transition-colors hover:bg-hover"
                    >
                        {topic.kind === 'term' ? <span className="text-subtle">#</span> : null}
                        <span className="first-letter:uppercase">{topic.term}</span>
                        {topic.kind === 'flair' && topic.community && (
                            <span className="text-subtle">in {communityLabel({ name: topic.community })}</span>
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
