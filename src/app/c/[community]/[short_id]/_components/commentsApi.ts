import { CommentSort } from '@/types/api';

export const DEFAULT_COMMENT_SORT: CommentSort = 'best';
export const COMMENT_PAGE_SIZE = 20;
// Reply levels and replies per comment loaded with each batch; the rest load on demand
export const REPLY_DEPTH = 3;
export const REPLIES_PER_COMMENT = 3;

export function commentsQuery(sort: CommentSort, limit: number, cursor?: string | null): URLSearchParams {
    return new URLSearchParams({
        sort,
        limit: String(limit),
        depth: String(REPLY_DEPTH),
        replies: String(REPLIES_PER_COMMENT),
        ...(cursor ? { cursor } : {}),
    });
}
