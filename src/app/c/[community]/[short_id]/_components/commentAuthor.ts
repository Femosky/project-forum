import { anonymousFor } from '@/lib/anonymous';
import { Comment } from '@/types/api';

// Who a comment shows as, shared by the comment list and the server-rendered "Replying to" card.
// The API drops author for anonymous, deleted and removed comments.
export function shownAvatar(comment: Comment) {
    const anonymous = anonymousFor(comment);
    return anonymous.hidden ? anonymous.picture : comment.author;
}

export function getAuthorName(comment: Comment): string {
    const anonymous = anonymousFor(comment);
    if (anonymous.hidden) return anonymous.mine ? 'Anonymous (you)' : 'Anonymous';
    if (comment.author?.username) return comment.author.username;
    return comment.status === 'deleted' || comment.status === 'removed' ? '[deleted]' : 'Anonymous';
}
