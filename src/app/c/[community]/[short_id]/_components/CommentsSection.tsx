'use client';

import { Fragment, createContext, useContext, useRef, useState } from 'react';
import Link from 'next/link';
import { Lock, MessagesSquare, Plus } from 'lucide-react';
import { SortByDropdown } from './SortByDropdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { ReplyActions } from './ReplyActions';
import ContentReplySection from './ContentReplySection';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useUIStore } from '@/lib/uiStore';
import { Comment, CommentResponse, CommentSort, CommentsResponse } from '@/types/api';
import Markdown from '@/components/common/Markdown';
import MarkdownEditor from '@/components/common/LazyMarkdownEditor';
import { COMMENT_BODY_MAX } from '@/lib/constants';
import { CommentSkeleton } from '@/components/post/PostSkeletons';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from './commentsApi';
import ThreadAdSlot from '@/ads/ThreadAdSlot';
import { slotAfter } from '@/ads/config';
import type { AdUnit } from '@/ads/types';
import UserAvatar from '@/components/ui/UserAvatar';

// Replies nest this deep; below that, "Continue this thread" opens the rest on its own
const MAX_VISIBLE_DEPTH = 8;
const MAX_PAGE = 100;

interface ThreadContextValue {
    postId: string;
    postPath: string;
    isLocked: boolean;
    isModerator: boolean;
    // Depth of the comments at the top of this view (not 0 when showing one comment's thread)
    baseDepth: number;
    sort: CommentSort;
    // The post's author, for the OP label on their replies (null when the post is anonymous)
    opUsername: string | null;
    createComment: (body: string, parentId?: string) => Promise<Comment>;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

function useThread(): ThreadContextValue {
    const thread = useContext(ThreadContext);
    if (!thread) throw new Error('useThread must be used inside CommentsSection');
    return thread;
}

type CommentsSectionProps = {
    postId: string;
    postPath: string;
    isLocked: boolean;
    // The author deleted the post: its comments stay up but take no new ones
    isPostDeleted?: boolean;
    isModerator: boolean;
    // Showing one comment and its replies (?comment=) rather than the whole thread
    isSingleThread: boolean;
    commentCount: number;
    opUsername?: string | null;
    initialComments: Comment[];
    initialCursor: string | null;
    loadFailed: boolean;
    // Ads for the slots between top-level comments (see ads/config.ts)
    ads?: AdUnit[];
};

export function CommentsSection({
    postId,
    postPath,
    isLocked,
    isPostDeleted = false,
    isModerator,
    isSingleThread,
    commentCount,
    opUsername = null,
    initialComments,
    initialCursor,
    loadFailed,
    ads = [],
}: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [cursor, setCursor] = useState<string | null>(initialCursor);
    const [sort, setSort] = useState<CommentSort>(DEFAULT_COMMENT_SORT);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(loadFailed ? "Couldn't load comments." : null);
    const setCommentCount = useUIStore((state) => state.setCommentCount);

    async function createComment(body: string, parentId?: string): Promise<Comment> {
        const { comment } = await api<CommentResponse>(`/posts/${postId}/comments`, {
            method: 'POST',
            body: { body, ...(parentId ? { parent_id: parentId } : {}) },
        });
        // The post's comment count on this page follows along without a refresh
        const current = useUIStore.getState().commentCounts[postId] ?? commentCount;
        setCommentCount(postId, current + 1);
        return comment;
    }

    async function handleTopLevelReply(body: string) {
        const comment = await createComment(body);
        setComments((current) => [comment, ...current]);
    }

    async function load(nextSort: CommentSort, nextCursor: string | null) {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api<CommentsResponse>(`/posts/${postId}/comments?${commentsQuery(nextSort, COMMENT_PAGE_SIZE, nextCursor)}`);
            setComments((current) => (nextCursor ? [...current, ...data.comments] : data.comments));
            setCursor(data.next_cursor);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }

    function changeSort(nextSort: CommentSort) {
        if (nextSort === sort) return;
        setSort(nextSort);
        load(nextSort, null);
    }

    return (
        <ThreadContext.Provider
            value={{ postId, postPath, isLocked, isModerator, baseDepth: initialComments[0]?.depth ?? 0, sort, opUsername, createComment }}
        >
            <div className="flex flex-col">
                {isSingleThread ? null : isPostDeleted ? (
                    <p className="my-3 flex items-center gap-2 rounded-[10px] bg-active px-4 py-3 text-sm text-muted">
                        <Lock className="size-4" /> The author deleted this post. Its comments stay up, but new ones are off.
                    </p>
                ) : isLocked ? (
                    <p className="my-3 flex items-center gap-2 rounded-[10px] bg-active px-4 py-3 text-sm text-muted">
                        <Lock className="size-4" /> Comments are locked. You can still read and vote.
                    </p>
                ) : (
                    <ContentReplySection handleReply={handleTopLevelReply} />
                )}

                {comments.length > 0 && !isSingleThread && (
                    <div className="flex justify-end pt-3">
                        <SortByDropdown sort={sort} onChange={changeSort} disabled={isLoading} />
                    </div>
                )}

                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}

                {comments.length === 0 && !isLoading && !error && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
                        <MessagesSquare className="size-8" />
                        <p className="text-sm">No replies yet. Start the conversation.</p>
                    </div>
                )}

                {/* Each top-level thread is its own block, set apart by a hairline */}
                <div className="flex w-full flex-col divide-y divide-border pb-6 [&>*]:py-4" aria-busy={isLoading}>
                    {comments.map((comment, index) => {
                        const slot = slotAfter(index, 'thread');
                        return (
                            <Fragment key={comment.id}>
                                {/* Wrapped so the thread's padding sits outside the comment its line is measured against */}
                                <div>
                                    <CommentBlock initialComment={comment} />
                                </div>
                                {slot !== null && <ThreadAdSlot unit={ads[slot]} />}
                            </Fragment>
                        );
                    })}

                    {isLoading && (
                        <>
                            <CommentSkeleton />
                            <CommentSkeleton />
                        </>
                    )}

                    {cursor && (
                        <Button variant="secondary" size="sm" onClick={() => load(sort, cursor)} disabled={isLoading} className="mx-auto mt-4 !py-0">
                            {isLoading ? 'Loading...' : 'Load more comments'}
                        </Button>
                    )}
                </div>
            </div>
        </ThreadContext.Provider>
    );
}

// The API drops author for anonymous, deleted and removed comments
function getAuthorName(comment: Comment): string {
    if (comment.author?.username) return comment.author.username;
    return comment.status === 'deleted' || comment.status === 'removed' ? '[deleted]' : 'Anonymous';
}

function CommentBlock({ initialComment }: { initialComment: Comment }) {
    const thread = useThread();
    const [comment, setComment] = useState<Comment>(initialComment);
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // Collapsed (Reddit-style): the whole comment folds into one row, replies and all
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [repliesError, setRepliesError] = useState<string | null>(null);
    // A comment deleted with nothing under it leaves the thread, as it would after a reload
    const [isDropped, setIsDropped] = useState(false);

    const replies = comment.replies ?? [];
    const totalReplies = Math.max(comment.reply_count, replies.length);
    const hiddenReplies = Math.max(totalReplies - replies.length, 0);
    const hasChildren = totalReplies > 0;
    const canReply = !thread.isLocked && comment.status === 'active';

    async function loadMoreReplies() {
        setIsLoadingReplies(true);
        setRepliesError(null);
        try {
            const limit = Math.min(Math.max(totalReplies, 1), MAX_PAGE);
            const data = await api<CommentsResponse>(`/comments/${comment.id}/replies?${commentsQuery(thread.sort, limit)}`);
            setComment((current) => {
                // Keep replies the viewer just wrote that the server's page didn't include
                const loaded = new Set(data.comments.map((reply) => reply.id));
                const own = (current.replies ?? []).filter((reply) => !loaded.has(reply.id) && reply.viewer?.is_author);
                return { ...current, replies: [...own, ...data.comments] };
            });
        } catch (error) {
            setRepliesError(errorMessage(error));
        } finally {
            setIsLoadingReplies(false);
        }
    }

    // Folds the comment and, if that left it above the screen or under the sticky bars, brings it back into view so
    // the page doesn't seem to jump somewhere else
    function collapse() {
        setIsCollapsed(true);
        requestAnimationFrame(() => {
            const element = document.getElementById(`c-${comment.short_id}`);
            if (!element) return;
            const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
            if (element.getBoundingClientRect().top < margin) element.scrollIntoView({ block: 'start' });
        });
    }

    async function handleReply(body: string) {
        const reply = await thread.createComment(body, comment.id);
        setComment((current) => ({
            ...current,
            replies: [reply, ...(current.replies ?? [])],
            reply_count: current.reply_count + 1,
        }));
        setIsCollapsed(false);
        setIsReplying(false);
    }

    async function handleEdit(body: string) {
        const { comment: updated } = await api<CommentResponse>(`/comments/${comment.id}`, { method: 'PATCH', body: { body } });
        setComment((current) => ({ ...current, body: updated.body, edited_at: updated.edited_at, status: updated.status }));
        setIsEditing(false);
    }

    function handleDeleted() {
        if (totalReplies === 0) {
            setIsDropped(true);
            return;
        }
        setComment((current) => ({
            ...current,
            status: 'deleted',
            body: '[deleted]',
            author: null,
            viewer: current.viewer ? { ...current.viewer, is_author: false } : null,
        }));
    }

    // Deep threads continue in their own view instead of squeezing further right
    const continuesElsewhere = hasChildren && comment.depth - thread.baseDepth >= MAX_VISIBLE_DEPTH - 1;

    function handleModerated(updated: Comment) {
        setComment((current) => ({ ...current, status: updated.status, body: updated.body, pinned_at: updated.pinned_at }));
    }

    const showsReplies = hasChildren && !continuesElsewhere;
    if (isDropped) return null;

    if (isCollapsed) {
        return (
            <div id={`c-${comment.short_id}`} className="comment relative grid w-full scroll-mt-[calc(var(--spacing-header)+3.5rem)] grid-cols-[28px_minmax(0,1fr)] gap-x-2.5">
                <UserAvatar user={comment.author} size={28} className="size-7 opacity-70" />
                <button
                    type="button"
                    onClick={() => setIsCollapsed(false)}
                    aria-expanded={false}
                    aria-label={`Show ${getAuthorName(comment)}'s comment${hasChildren ? ` and ${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}` : ''}`}
                    className="flex h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-md text-left text-[13px] text-subtle transition-colors hover:text-text"
                >
                    <span className="truncate font-semibold text-muted">{getAuthorName(comment)}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={comment.created_at} suppressHydrationWarning className="shrink-0">
                        {TimeUtility.formatTimeAgo(comment.created_at)}
                    </time>
                    <span className="ml-1 flex h-[22px] shrink-0 items-center gap-0.5 rounded-full px-1.5 font-semibold text-muted ring-1 ring-inset ring-border-strong">
                        <Plus className="size-3.5" />
                        {hasChildren ? totalReplies : null}
                    </span>
                </button>
            </div>
        );
    }

    return (
        // Notifications link here with #c-{shortId}. Replies hang off a line from this avatar (see .comment in
        // globals.css); the line, and each curve off it, is a button that folds this comment, replies and all.
        <div id={`c-${comment.short_id}`} className="comment relative grid w-full scroll-mt-[calc(var(--spacing-header)+3.5rem)] grid-cols-[28px_minmax(0,1fr)] gap-x-2.5">
            {showsReplies && (
                <button
                    type="button"
                    className="thread-line"
                    aria-label={`Collapse ${getAuthorName(comment)}'s comment and ${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`}
                    aria-expanded
                    onClick={collapse}
                />
            )}
            <UserAvatar user={comment.author} size={28} className="size-7" />

            <div className="flex min-w-0 flex-col">
                {isEditing ? (
                    <>
                        <TitleSection username={getAuthorName(comment)} createdAt={comment.created_at} editedAt={comment.edited_at} />
                        <EditBox initialBody={comment.body} onSave={handleEdit} onCancel={() => setIsEditing(false)} />
                    </>
                ) : (
                    <TextSection comment={comment} isOp={Boolean(thread.opUsername && comment.author?.username === thread.opUsername)} />
                )}

                {!isEditing && (
                    <ReplyActions
                        comment={comment}
                        canReply={canReply}
                        isReplying={isReplying}
                        toggleReplyMode={() => setIsReplying(!isReplying)}
                        onDeleted={handleDeleted}
                        onModerated={thread.isModerator ? handleModerated : undefined}
                        onEdit={() => {
                            setIsReplying(false);
                            setIsEditing(true);
                        }}
                    />
                )}

                {isReplying && (
                    <div className="mt-2">
                        <ContentReplySection fromReply toggleReplyMode={() => setIsReplying(false)} handleReply={handleReply} />
                    </div>
                )}

                {continuesElsewhere && (
                    <Link href={`${thread.postPath}?comment=${comment.short_id}`} className="mt-1 text-[13px] font-semibold text-text hover:underline">
                        Continue this thread ({totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}) →
                    </Link>
                )}

                {showsReplies && (
                    <div className="replies">
                        {replies.map((reply) => (
                            <div key={reply.id} className="reply">
                                {/* The curve into this reply is part of the parent's line: clicking it folds the parent too */}
                                <button type="button" className="thread-elbow" tabIndex={-1} aria-hidden onClick={collapse} />
                                <CommentBlock initialComment={reply} />
                            </div>
                        ))}
                        {hiddenReplies > 0 && (
                            <div className="reply reply-more">
                                <button
                                    type="button"
                                    onClick={loadMoreReplies}
                                    disabled={isLoadingReplies}
                                    className="flex h-7 cursor-pointer items-center rounded-md px-2 text-[13px] font-semibold text-text transition-colors hover:bg-hover disabled:opacity-50"
                                >
                                    {isLoadingReplies ? 'Loading...' : `${hiddenReplies} more ${hiddenReplies === 1 ? 'reply' : 'replies'}`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {repliesError && <ErrorMessage size="small" errorMessage={repliesError} role="alert" />}
            </div>
        </div>
    );
}

function TitleSection({
    username,
    profile,
    isOp = false,
    createdAt,
    editedAt,
}: {
    username: string;
    profile?: string;
    isOp?: boolean;
    createdAt: string;
    editedAt: string | null;
}) {
    return (
        <div className="flex min-h-7 flex-wrap items-center gap-x-1.5 text-[13px] text-subtle">
            {profile ? (
                <Link href={`/u/${profile}`} className="font-semibold text-text hover:underline">
                    {username}
                </Link>
            ) : (
                <span className="font-semibold text-text">{username}</span>
            )}
            {isOp && <span className="rounded-full bg-active px-1.5 text-[11px] font-semibold leading-[18px] text-muted">OP</span>}
            {/* Rendered on the server and again in the browser a moment later, so the text may differ slightly */}
            <time dateTime={createdAt} suppressHydrationWarning>
                {TimeUtility.formatTimeAgo(createdAt)}
            </time>
            {editedAt && (
                <>
                    <span aria-hidden>·</span>
                    <span suppressHydrationWarning>Edited {TimeUtility.formatTimeAgo(editedAt)}</span>
                </>
            )}
        </div>
    );
}

function TextSection({ comment, isOp }: { comment: Comment; isOp: boolean }) {
    const isGone = comment.status === 'deleted' || comment.status === 'removed';
    return (
        <div className="flex flex-col">
            <TitleSection
                username={getAuthorName(comment)}
                profile={comment.author?.username}
                isOp={isOp}
                createdAt={comment.created_at}
                editedAt={comment.edited_at}
            />
            {comment.status === 'removed' && comment.body !== '[removed]' && (
                // Only moderators get the text of a removed comment back
                <p className="text-xs font-semibold text-danger">Removed by moderators</p>
            )}
            {comment.status === 'pending' && (
                <p className="text-xs font-semibold text-muted">
                    {comment.held_reason ? `Held for review: ${comment.held_reason}` : 'Waiting for a moderator to review it. Only you can see it for now.'}
                </p>
            )}
            {isGone ? (
                <p className="text-sm italic text-muted">{comment.body}</p>
            ) : (
                <Markdown text={comment.body} className="text-sm leading-[21px] text-body" />
            )}
        </div>
    );
}

// In-place editor for the viewer's own comment
function EditBox({ initialBody, onSave, onCancel }: { initialBody: string; onSave: (body: string) => Promise<void>; onCancel: () => void }) {
    const [body, setBody] = useState(initialBody);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!body.trim() || isSaving) return;
        setIsSaving(true);
        setError(null);
        try {
            await onSave(body.trim());
        } catch (error) {
            setError(errorMessage(error));
            setIsSaving(false);
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="mt-1 flex flex-col gap-2" noValidate>
            <MarkdownEditor
                name="edit-comment"
                variant="compact"
                placeholder="Edit your comment"
                autoFocus
                maxLength={COMMENT_BODY_MAX}
                value={body}
                onChange={setBody}
                onSubmitShortcut={() => formRef.current?.requestSubmit()}
                footer={
                    <>
                        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!body.trim() || body.trim() === initialBody || isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </>
                }
            />
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
        </form>
    );
}
