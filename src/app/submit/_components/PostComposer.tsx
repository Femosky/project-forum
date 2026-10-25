'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, FileText, Link2, Repeat } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import { useChallenge } from '@/components/common/Turnstile';
import InputField from '@/components/ui/Input';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getPostPath } from '@/components/post/PostCard';
import { api } from '@/lib/api/client';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { POST_BODY_MAX, POST_TITLE_MAX, POST_TITLE_MIN } from '@/lib/constants';
import { Flair, FlairsResponse, LinkPreview, LinkPreviewResponse, Post, PostResponse, PostsResponse } from '@/types/api';
import { communityLabel } from '@/lib/communityName';
import CommunityPicker, { CommunityOption } from './CommunityPicker';

export type { CommunityOption };

type Draft = {
    community: string;
    type: 'text' | 'link';
    title: string;
    body: string;
    url: string;
    flairId: string;
    isAnonymous: boolean;
};

const DRAFT_KEY = 'post-draft';
const EMPTY_DRAFT: Draft = { community: '', type: 'text', title: '', body: '', url: '', flairId: '', isAnonymous: false };

// Wait for typing to pause before looking a link up
const LINK_CHECK_DELAY_MS = 600;

function isWebUrl(value: string): boolean {
    try {
        const url = new URL(value.trim());
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
    } catch {
        return false;
    }
}

function readDraft(): Partial<Draft> {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
    } catch {
        return {};
    }
}

function writeDraft(draft: Draft | null) {
    try {
        if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        else localStorage.removeItem(DRAFT_KEY);
    } catch {
        // Private mode or storage full: drafts just aren't kept
    }
}

function validate(draft: Draft): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!draft.community) errors.community = 'Pick a community.';
    const title = draft.title.trim();
    if (title.length < POST_TITLE_MIN) errors.title = `Titles need at least ${POST_TITLE_MIN} characters.`;
    if (draft.type === 'link') {
        try {
            const url = new URL(draft.url.trim());
            if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
        } catch {
            errors.url = 'Enter a full link, starting with https://';
        }
    }
    return errors;
}

type ComposerProps = {
    joined: CommunityOption[];
    popular: CommunityOption[];
    initialCommunity?: string;
    // New-account limits (the API enforces them; this explains them before anyone hits an error)
    canPostLinks: boolean;
    canPostAnonymously: boolean;
};

export function PostComposer({ joined, popular, initialCommunity, canPostLinks, canPostAnonymously }: ComposerProps) {
    const router = useRouter();
    const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT, community: initialCommunity ?? '' });
    const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // New accounts are checked for bots on their first day; the API says when
    const challenge = useChallenge(false);

    // Restore an unsent draft once on load (a community in the URL wins), then keep it saved as you type
    useEffect(() => {
        const saved = readDraft();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft((current) => ({
            ...current,
            ...saved,
            community: initialCommunity || saved.community || current.community,
            ...(canPostLinks ? {} : { type: 'text' as const }),
            ...(canPostAnonymously ? {} : { isAnonymous: false }),
        }));
        setHasLoadedDraft(true);
    }, [initialCommunity, canPostLinks, canPostAnonymously]);

    useEffect(() => {
        if (hasLoadedDraft) writeDraft(draft);
    }, [draft, hasLoadedDraft]);

    // The chosen community's flairs, if it has any
    const [flairs, setFlairs] = useState<Flair[]>([]);
    useEffect(() => {
        if (!draft.community) return;
        let isCurrent = true;
        api<FlairsResponse>(`/communities/${draft.community}/flairs`)
            .then((data) => isCurrent && setFlairs(data.flairs))
            .catch(() => isCurrent && setFlairs([]));
        return () => {
            isCurrent = false;
        };
    }, [draft.community]);

    // For link posts: a preview card and earlier posts of the same link, once typing pauses
    const [preview, setPreview] = useState<LinkPreview | null>(null);
    const [duplicates, setDuplicates] = useState<Post[]>([]);
    const [isCheckingLink, setIsCheckingLink] = useState(false);
    const linkToCheck = draft.type === 'link' && isWebUrl(draft.url) ? draft.url.trim() : null;
    useEffect(() => {
        if (!linkToCheck) return;
        let isCurrent = true;
        const timer = setTimeout(async () => {
            setIsCheckingLink(true);
            const query = `url=${encodeURIComponent(linkToCheck)}`;
            const [previewResult, duplicateResult] = await Promise.all([
                api<LinkPreviewResponse>(`/posts/link-preview?${query}`).catch(() => null),
                api<PostsResponse>(`/posts/duplicates?${query}`).catch(() => null),
            ]);
            if (!isCurrent) return;
            setPreview(previewResult?.preview ?? null);
            setDuplicates(duplicateResult?.posts ?? []);
            setIsCheckingLink(false);
        }, LINK_CHECK_DELAY_MS);
        return () => {
            isCurrent = false;
            clearTimeout(timer);
        };
    }, [linkToCheck]);
    const shownPreview = linkToCheck ? preview : null;
    const shownDuplicates = linkToCheck ? duplicates : [];
    const availableFlairs = draft.community ? flairs : [];

    function update<K extends keyof Draft>(key: K, value: Draft[K]) {
        setDraft((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: '' }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const errors = validate(draft);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;
        if (challenge.isPending) {
            setError('Complete the check below first.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const { post } = await api<PostResponse>('/posts', {
                method: 'POST',
                body: {
                    community: draft.community,
                    type: draft.type,
                    title: draft.title.trim(),
                    body: draft.body.trim(),
                    ...(draft.type === 'link' ? { url: draft.url.trim() } : {}),
                    ...(draft.flairId && availableFlairs.some((flair) => flair.id === draft.flairId) ? { flair_id: draft.flairId } : {}),
                    is_anonymous: draft.isAnonymous,
                    turnstile_token: challenge.token,
                },
            });
            writeDraft(null);
            router.push(getPostPath(post));
        } catch (error) {
            if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
            challenge.afterError(error);
            setError(errorMessage(error));
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="community" className="text-sm font-semibold">
                    Community
                </label>
                <CommunityPicker
                    value={draft.community}
                    onChange={(name) => update('community', name)}
                    joined={joined}
                    popular={popular}
                    invalid={Boolean(fieldErrors.community)}
                />
                {fieldErrors.community && <ErrorMessage errorMessage={fieldErrors.community} />}
            </div>

            <div role="tablist" aria-label="Post type" className="flex gap-1 rounded-full bg-surface-muted p-1">
                {(
                    [
                        { value: 'text', label: 'Text', icon: FileText },
                        { value: 'link', label: 'Link', icon: Link2 },
                    ] as const
                ).map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={draft.type === value}
                        disabled={value === 'link' && !canPostLinks}
                        onClick={() => update('type', value)}
                        className={twMerge(
                            'flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            draft.type === value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                        )}
                    >
                        <Icon className="size-4" /> {label}
                    </button>
                ))}
            </div>

            {!canPostLinks && (
                <p className="-mt-2 text-xs text-muted">
                    New accounts can share links once they are a day old or have 10 karma. This keeps scammers out.
                </p>
            )}

            <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                    <label htmlFor="title" className="text-sm font-semibold">
                        Title
                    </label>
                    <span className="text-xs tabular-nums text-muted">
                        {draft.title.length}/{POST_TITLE_MAX}
                    </span>
                </div>
                <InputField
                    name="title"
                    placeholder="What do you want to ask or share?"
                    maxLength={POST_TITLE_MAX}
                    value={draft.title}
                    onChange={(e) => update('title', e.target.value)}
                    outline={fieldErrors.title ? 'error' : 'default'}
                />
                {fieldErrors.title && <ErrorMessage errorMessage={fieldErrors.title} />}
            </div>

            {draft.type === 'link' && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="url" className="text-sm font-semibold">
                        Link
                    </label>
                    <InputField
                        type="url"
                        name="url"
                        inputMode="url"
                        autoCapitalize="none"
                        placeholder="https://"
                        value={draft.url}
                        onChange={(e) => update('url', e.target.value)}
                        outline={fieldErrors.url ? 'error' : 'default'}
                    />
                    {fieldErrors.url && <ErrorMessage errorMessage={fieldErrors.url} />}
                    {isCheckingLink && <p className="text-xs text-muted">Checking the link...</p>}
                    {shownPreview?.title && (
                        <div className="flex items-stretch overflow-hidden rounded-xl border border-border">
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
                                <span className="line-clamp-2 text-sm font-bold">{shownPreview.title}</span>
                                {shownPreview.description && <span className="line-clamp-2 text-xs text-muted">{shownPreview.description}</span>}
                                <span className="flex items-center gap-1 text-xs text-link">
                                    {shownPreview.site ?? new URL(linkToCheck!).hostname} <ExternalLink className="size-3" />
                                </span>
                            </div>
                            {shownPreview.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={shownPreview.image} alt="" className="h-20 w-28 shrink-0 object-cover" />
                            )}
                        </div>
                    )}
                    {shownDuplicates.length > 0 && (
                        <div className="flex flex-col gap-1 rounded-xl bg-surface-muted px-3 py-2 text-sm">
                            <p className="flex items-center gap-1.5 font-semibold">
                                <Repeat className="size-4" /> This link was already posted
                            </p>
                            <ul className="flex flex-col gap-0.5">
                                {shownDuplicates.map((post) => (
                                    <li key={post.id} className="truncate">
                                        <Link href={getPostPath(post)} className="text-link hover:underline" target="_blank">
                                            {post.title}
                                        </Link>{' '}
                                        <span className="text-muted">
                                            in {communityLabel(post.community)} · {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-muted">You can still post it; joining that conversation might get you more answers.</p>
                        </div>
                    )}
                </div>
            )}

            {availableFlairs.length > 0 && (
                <fieldset className="flex flex-col gap-1.5">
                    <legend className="text-sm font-semibold">Flair (optional)</legend>
                    <div className="flex flex-wrap gap-2">
                        {availableFlairs.map((flair) => (
                            <button
                                key={flair.id}
                                type="button"
                                aria-pressed={draft.flairId === flair.id}
                                onClick={() => update('flairId', draft.flairId === flair.id ? '' : flair.id)}
                                className={twMerge(
                                    'h-8 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-colors',
                                    draft.flairId === flair.id ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong hover:bg-surface-muted'
                                )}
                            >
                                {flair.name}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="body" className="text-sm font-semibold">
                    {draft.type === 'link' ? 'Add some context (optional)' : 'Details (optional)'}
                </label>
                <MarkdownEditor
                    name="body"
                    placeholder="Add details, background or what you've already tried"
                    maxLength={POST_BODY_MAX}
                    value={draft.body}
                    onChange={(value) => update('body', value)}
                    invalid={Boolean(fieldErrors.body)}
                />
                {fieldErrors.body && <ErrorMessage errorMessage={fieldErrors.body} />}
            </div>

            <label className={twMerge('flex items-start gap-2.5 text-sm', canPostAnonymously ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}>
                <input
                    type="checkbox"
                    checked={draft.isAnonymous}
                    disabled={!canPostAnonymously}
                    onChange={(e) => update('isAnonymous', e.target.checked)}
                    className="mt-0.5 size-4 accent-accent"
                />
                <span>
                    <span className="font-semibold">Post anonymously</span>
                    <span className="block text-muted">
                        {canPostAnonymously
                            ? "Your username is hidden from everyone except the community's moderators."
                            : 'Available once your account is a day old and your email is verified.'}
                    </span>
                </span>
            </label>

            {challenge.widget}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}

            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
            </div>
        </form>
    );
}

export default PostComposer;
