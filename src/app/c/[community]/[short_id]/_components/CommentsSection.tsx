'use client';

import { createContext, useContext, useState } from 'react';
import { ChevronDown, ChevronUp, Lock, MessagesSquare } from 'lucide-react';
import { SortByDropdown } from './SortByDropdown';
import TimeUtility from '@/lib/utils/TimeUtility';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { ReplyActions } from './ReplyActions';
import ContentReplySection from './ContentReplySection';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useUIStore } from '@/lib/uiStore';
import { Comment, CommentResponse, CommentSort, CommentsResponse } from '@/types/api';
import { COMMENT_PAGE_SIZE, DEFAULT_COMMENT_SORT, commentsQuery } from './commentsApi';

// Replies nest this deep before the thread stops indenting further
const MAX_VISIBLE_DEPTH = 8;
const MAX_PAGE = 100;

interface ThreadContextValue {
    postId: string;
    isLocked: boolean;
    sort: CommentSort;
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
    isLocked: boolean;
    commentCount: number;
    initialComments: Comment[];
    initialCursor: string | null;
    loadFailed: boolean;
};

export function CommentsSection({ postId, isLocked, commentCount, initialComments, initialCursor, loadFailed }: CommentsSectionProps) {
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
        <ThreadContext.Provider value={{ postId, isLocked, sort, createComment }}>
            <div className="flex flex-col gap-4">
                {isLocked ? (
                    <p className="flex items-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
                        <Lock className="size-4" /> Comments are locked. You can still read and vote.
                    </p>
                ) : (
                    <ContentReplySection handleReply={handleTopLevelReply} />
                )}

                {comments.length > 0 && (
                    <div className="-ml-3">
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

                <div className="flex w-full flex-col gap-4 pb-6" aria-busy={isLoading}>
                    {comments.map((comment) => (
                        <CommentBlock key={comment.id} initialComment={comment} />
                    ))}

                    {cursor && (
                        <Button variant="secondary" onClick={() => load(sort, cursor)} disabled={isLoading} className="self-center">
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
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [repliesError, setRepliesError] = useState<string | null>(null);

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

    async function showReplies() {
        setIsExpanded(true);
        if (hiddenReplies > 0) await loadMoreReplies();
    }

    async function handleReply(body: string) {
        const reply = await thread.createComment(body, comment.id);
        setComment((current) => ({
            ...current,
            replies: [reply, ...(current.replies ?? [])],
            reply_count: current.reply_count + 1,
        }));
        setIsExpanded(true);
        setIsReplying(false);
    }

    function handleDeleted() {
        setComment((current) => ({
            ...current,
            status: 'deleted',
            body: '[deleted]',
            author: null,
            viewer: current.viewer ? { ...current.viewer, is_author: false } : null,
        }));
    }

    const nested = comment.depth < MAX_VISIBLE_DEPTH;

    return (
        <div className="flex w-full gap-2.5">
            <ShapeSection
                username={getAuthorName(comment)}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                toggleHideAllReplies={() => setIsExpanded(false)}
            />

            <div className="flex min-w-0 w-full flex-col gap-3">
                <div className="flex w-full flex-col gap-1">
                    <TextSection comment={comment} />

                    <ReplyActions
                        comment={comment}
                        canReply={canReply}
                        isReplying={isReplying}
                        toggleReplyMode={() => setIsReplying(!isReplying)}
                        onDeleted={handleDeleted}
                    />

                    {isReplying && (
                        <ContentReplySection fromReply toggleReplyMode={() => setIsReplying(false)} handleReply={handleReply} />
                    )}
                </div>

                {/* Child replies. Past the visible depth they stop indenting so threads stay readable on phones. */}
                {isExpanded && replies.length > 0 && (
                    <div className={nested ? 'flex flex-col gap-3' : '-ml-10 flex flex-col gap-3 border-l-2 border-border pl-2'}>
                        {replies.map((reply) => (
                            <CommentBlock key={reply.id} initialComment={reply} />
                        ))}
                    </div>
                )}

                {hasChildren && (
                    <div className="-ml-3 flex flex-wrap items-center gap-1">
                        {(!isExpanded || hiddenReplies > 0) && (
                            <Button
                                onClick={showReplies}
                                variant="ghost"
                                size="sm"
                                className="text-link"
                                disabled={isLoadingReplies}
                            >
                                <ChevronDown className="size-4" />
                                {isLoadingReplies
                                    ? 'Loading...'
                                    : isExpanded
                                      ? `${hiddenReplies} more ${hiddenReplies === 1 ? 'reply' : 'replies'}`
                                      : `${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`}
                            </Button>
                        )}
                        {isExpanded && replies.length > 0 && (
                            <Button variant="ghost" size="sm" className="text-muted" onClick={() => setIsExpanded(false)}>
                                <ChevronUp className="size-4" />
                                Hide replies
                            </Button>
                        )}
                        {repliesError && <ErrorMessage errorMessage={repliesError} role="alert" />}
                    </div>
                )}
            </div>
        </div>
    );
}

function ShapeSection({
    username,
    hasChildren,
    isExpanded,
    toggleHideAllReplies,
}: {
    username: string;
    hasChildren: boolean;
    isExpanded: boolean;
    toggleHideAllReplies: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <Avatar name={username} size="md" />

            {/* Thread line: click to collapse the replies */}
            {hasChildren && isExpanded && (
                <button
                    type="button"
                    aria-label={`Hide replies to ${username}`}
                    onClick={toggleHideAllReplies}
                    className="group flex w-full flex-1 cursor-pointer flex-col items-center"
                >
                    <span className="w-px flex-1 bg-border transition-colors group-hover:bg-border-strong" />
                </button>
            )}
        </div>
    );
}

function TitleSection({ username, createdAt, editedAt }: { username: string; createdAt: string; editedAt: string | null }) {
    return (
        <div className="flex min-h-8 flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <span className="font-bold text-text">{username}</span>
            <span aria-hidden>•</span>
            {/* Rendered on the server and again in the browser a moment later, so the text may differ slightly */}
            <time dateTime={createdAt} suppressHydrationWarning>
                {TimeUtility.formatTimeAgo(createdAt)}
            </time>
            {editedAt && (
                <>
                    <span aria-hidden>•</span>
                    <span suppressHydrationWarning>Edited {TimeUtility.formatTimeAgo(editedAt)}</span>
                </>
            )}
        </div>
    );
}

function TextSection({ comment }: { comment: Comment }) {
    const isGone = comment.status === 'deleted' || comment.status === 'removed';
    return (
        <div className="flex flex-col gap-0.5">
            <TitleSection username={getAuthorName(comment)} createdAt={comment.created_at} editedAt={comment.edited_at} />
            <p className={isGone ? 'italic text-muted' : 'whitespace-pre-wrap break-words'}>{comment.body}</p>
        </div>
    );
}
