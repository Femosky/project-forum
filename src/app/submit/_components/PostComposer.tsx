'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Link2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import InputField, { fieldStyles } from '@/components/ui/Input';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getPostPath } from '@/components/post/PostCard';
import { api } from '@/lib/api/client';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { POST_BODY_MAX, POST_TITLE_MAX, POST_TITLE_MIN } from '@/lib/constants';
import { PostResponse } from '@/types/api';

export type CommunityOption = { name: string; label: string | null; joined: boolean };

type Draft = { community: string; type: 'text' | 'link'; title: string; body: string; url: string; isAnonymous: boolean };

const DRAFT_KEY = 'post-draft';
const EMPTY_DRAFT: Draft = { community: '', type: 'text', title: '', body: '', url: '', isAnonymous: false };

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

export function PostComposer({ communities, initialCommunity }: { communities: CommunityOption[]; initialCommunity?: string }) {
    const router = useRouter();
    const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT, community: initialCommunity ?? '' });
    const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Restore an unsent draft once on load (a community in the URL wins), then keep it saved as you type
    useEffect(() => {
        const saved = readDraft();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft((current) => ({ ...current, ...saved, community: initialCommunity || saved.community || current.community }));
        setHasLoadedDraft(true);
    }, [initialCommunity]);

    useEffect(() => {
        if (hasLoadedDraft) writeDraft(draft);
    }, [draft, hasLoadedDraft]);

    function update<K extends keyof Draft>(key: K, value: Draft[K]) {
        setDraft((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: '' }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const errors = validate(draft);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

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
                    is_anonymous: draft.isAnonymous,
                },
            });
            writeDraft(null);
            router.push(getPostPath(post));
        } catch (error) {
            if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
            setError(errorMessage(error));
            setIsSubmitting(false);
        }
    }

    const hasSelectedOption = communities.some((c) => c.name === draft.community);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="community" className="text-sm font-semibold">
                    Community
                </label>
                <select
                    id="community"
                    name="community"
                    value={draft.community}
                    onChange={(e) => update('community', e.target.value)}
                    className={twMerge(fieldStyles({ outline: fieldErrors.community ? 'error' : 'default' }), 'cursor-pointer appearance-auto')}
                >
                    <option value="">Choose a community</option>
                    {draft.community && !hasSelectedOption && <option value={draft.community}>c/{draft.community}</option>}
                    {communities.some((c) => c.joined) && (
                        <optgroup label="Your communities">
                            {communities
                                .filter((c) => c.joined)
                                .map((c) => (
                                    <option key={c.name} value={c.name}>
                                        c/{c.name}
                                    </option>
                                ))}
                        </optgroup>
                    )}
                    {communities.some((c) => !c.joined) && (
                        <optgroup label="Other communities">
                            {communities
                                .filter((c) => !c.joined)
                                .map((c) => (
                                    <option key={c.name} value={c.name}>
                                        c/{c.name}
                                    </option>
                                ))}
                        </optgroup>
                    )}
                </select>
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
                        onClick={() => update('type', value)}
                        className={twMerge(
                            'flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors',
                            draft.type === value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                        )}
                    >
                        <Icon className="size-4" /> {label}
                    </button>
                ))}
            </div>

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
                </div>
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

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                    type="checkbox"
                    checked={draft.isAnonymous}
                    onChange={(e) => update('isAnonymous', e.target.checked)}
                    className="mt-0.5 size-4 accent-accent"
                />
                <span>
                    <span className="font-semibold">Post anonymously</span>
                    <span className="block text-muted">Your username is hidden from everyone except the community&apos;s moderators.</span>
                </span>
            </label>

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
