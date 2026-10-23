// Shapes returned by the backend's /v1 API (reference: Backend/docs/API.md).
// Anonymous, deleted and removed content comes back with author set to null.

export type VoteValue = 1 | 0 | -1;

export interface ApiErrorBody {
    error: { code: string; message: string; fields?: Record<string, string> };
}

export interface AuthorRef {
    username: string;
    display_name: string | null;
    avatar_id: string;
}

export interface CommunityRef {
    id: string;
    name: string;
    display_name: string | null;
    image_url: string | null;
}

// Present only when signed in
export interface ContentViewer {
    vote: VoteValue;
    saved: boolean;
    is_author: boolean;
}

export interface LinkPreview {
    title?: string;
    description?: string;
    image?: string;
    site?: string;
}

export type ContentStatus = 'active' | 'pending' | 'locked' | 'removed' | 'deleted';

export interface Post {
    id: string;
    short_id: string;
    slug: string;
    type: 'text' | 'link';
    title: string;
    body: string;
    url: string | null;
    link_preview: LinkPreview | null;
    ai_summary: string | null;
    is_anonymous: boolean;
    is_nsfw: boolean;
    is_sponsored: boolean;
    status: ContentStatus;
    flair: { id: string; name: string; color: string | null } | null;
    created_at: string;
    edited_at: string | null;
    pinned_at: string | null;
    upvote_count: number;
    downvote_count: number;
    score: number;
    comment_count: number;
    community: CommunityRef;
    author: AuthorRef | null;
    viewer: ContentViewer | null;
}

export interface Comment {
    id: string;
    short_id: string;
    post_id: string;
    parent_id: string | null;
    depth: number;
    body: string;
    is_anonymous: boolean;
    is_sponsored: boolean;
    status: ContentStatus;
    created_at: string;
    edited_at: string | null;
    pinned_at: string | null;
    upvote_count: number;
    downvote_count: number;
    score: number;
    reply_count: number;
    author: AuthorRef | null;
    viewer: ContentViewer | null;
    replies?: Comment[];
    // Replies that exist but weren't included in this response
    more_replies?: number;
}

export interface Community {
    id: string;
    name: string;
    display_name: string | null;
    description: string | null;
    image_url: string | null;
    rules: unknown;
    visibility: 'public' | 'private';
    status: string;
    is_nsfw: boolean;
    member_count: number;
    post_count: number;
    created_at: string;
}

export interface CommunityViewer {
    is_member: boolean;
    role: 'owner' | 'moderator' | 'member' | null;
    is_banned: boolean;
    has_pending_request: boolean;
}

export interface PrivateUser {
    id: string;
    username: string;
    email: string;
    display_name: string | null;
    avatar_id: string;
    role: string;
    karma: number;
    is_email_verified: boolean;
    has_password: boolean;
    has_google: boolean;
    created_at: string;
}

export interface Session {
    id: string;
    created_at: string;
    last_used_at: string | null;
    browser: string | null;
    os: string | null;
    device_type: string | null;
    country: string | null;
    city: string | null;
    current: boolean;
}

export interface SessionsResponse {
    sessions: Session[];
}

export interface PublicUser {
    username: string;
    display_name: string | null;
    avatar_id: string;
    karma: number;
    is_suspended: boolean;
    created_at: string;
}

export interface PublicUserResponse {
    user: PublicUser;
}

// A comment listed outside its thread (profiles), with enough of its post to link to it
export interface ListedComment extends Comment {
    post: { short_id: string; slug: string; title: string; community: string };
}

export interface SavedCommentsResponse {
    comments: ListedComment[];
    next_cursor: string | null;
}

export interface UserCommentsResponse {
    comments: ListedComment[];
    next_cursor: string | null;
}

export interface SearchPostsResponse {
    posts: Post[];
    next_page: number | null;
}

export interface SearchCommunitiesResponse {
    communities: Community[];
    next_page: number | null;
}

export interface AppNotification {
    id: string;
    type: 'post_reply' | 'comment_reply' | 'mention';
    created_at: string;
    read_at: string | null;
    actor: AuthorRef | null;
    post: { short_id: string; slug: string; title: string; community: string };
    comment: { short_id: string; excerpt: string };
}

export interface NotificationsResponse {
    notifications: AppNotification[];
    next_cursor: string | null;
    unread_count: number;
}

export interface UnreadCountResponse {
    count: number;
}

export interface Flair {
    id: string;
    name: string;
    color: string | null;
}

export interface FlairsResponse {
    flairs: Flair[];
}

export interface LinkPreviewResponse {
    preview: LinkPreview | null;
}

export type PostSort = 'hot' | 'new' | 'top';
export type CommentSort = 'best' | 'top' | 'new' | 'old';

export interface PostsResponse {
    posts: Post[];
    next_cursor: string | null;
}

export interface FeedResponse extends PostsResponse {
    scope: 'home' | 'all';
}

export interface PostResponse {
    post: Post;
}

export interface CommentsResponse {
    comments: Comment[];
    next_cursor: string | null;
}

export interface CommentResponse {
    comment: Comment;
}

export interface VoteResponse {
    upvote_count: number;
    downvote_count: number;
    score: number;
    vote: VoteValue;
}

export interface CommunitiesResponse {
    communities: Community[];
    next_cursor?: string | null;
}

export interface MyCommunitiesResponse {
    communities: (Community & { role: CommunityViewer['role'] })[];
}

export interface CommunityResponse {
    community: Community;
    moderators: (AuthorRef & { role: string })[];
    viewer: CommunityViewer | null;
}

export interface MembershipResponse {
    status: 'joined' | 'requested' | 'left';
}

export interface UserResponse {
    user: PrivateUser;
}

export type ReportReason =
    | 'spam'
    | 'harassment'
    | 'hate'
    | 'violence'
    | 'sexual'
    | 'self_harm'
    | 'misinformation'
    | 'illegal'
    | 'impersonation'
    | 'other';
