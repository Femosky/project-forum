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
    // How many people opened it; sent to the author only
    views?: number;
}

export interface UserStatsResponse {
    stats: { posts: number; comments: number; upvotes_received: number; downvotes_received: number; views: number };
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
    // Why the automatic filters held it for review; moderators only
    held_reason: string | null;
    flair: { id: string; name: string; color: string | null } | null;
    created_at: string;
    edited_at: string | null;
    pinned_at: string | null;
    upvote_count: number;
    downvote_count: number;
    score: number;
    comment_count: number;
    // Whether search engines should index this post's page (brand-new accounts and very short posts wait)
    is_indexable: boolean;
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
    held_reason: string | null;
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
    rules: CommunityRule[] | null;
    category: CommunityCategoryId | null;
    visibility: 'public' | 'private';
    status: string;
    is_nsfw: boolean;
    member_count: number;
    post_count: number;
    created_at: string;
}

export interface CommunityRule {
    title: string;
    description: string;
}

export type CommunityCategoryId =
    | 'careers'
    | 'tech'
    | 'relocation'
    | 'education'
    | 'housing'
    | 'money'
    | 'business'
    | 'cars'
    | 'health'
    | 'relationships'
    | 'sports'
    | 'food'
    | 'entertainment'
    | 'other';

export interface CommunityCategory {
    id: CommunityCategoryId;
    label: string;
    count: number;
}

export interface CategoriesResponse {
    categories: CommunityCategory[];
}

export interface CommunityViewer {
    is_member: boolean;
    role: 'owner' | 'moderator' | 'member' | null;
    is_banned: boolean;
    has_pending_request: boolean;
    muted_until: string | null;
    // Moderators only: items waiting in the mod queue
    queue_count: number | null;
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
    // New-account limits, so the composer can explain them up front
    can_post_links: boolean;
    can_post_anonymously: boolean;
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
    id: string;
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

// First pages that found little also carry a spelling suggestion and (posts, comments) similar community names
interface SearchHints {
    did_you_mean?: string | null;
    related_communities?: Community[];
}

export interface SearchPostsResponse extends SearchHints {
    posts: Post[];
    next_page: number | null;
}

export interface SearchCommentsResponse extends SearchHints {
    comments: ListedComment[];
    next_page: number | null;
}

export interface SearchCommunitiesResponse extends SearchHints {
    communities: Community[];
    next_page: number | null;
}

export interface AutocompleteResponse {
    communities: { name: string; display_name: string | null; image_url: string | null; member_count: number }[];
    users: { username: string; display_name: string | null; avatar_id: string }[];
}

// GET /trending: snapshots recomputed every 10 minutes
export interface TrendingPostsResponse {
    posts: Post[];
    computed_at: string | null;
}

export interface TrendingCommunity extends Community {
    trending: { new_members: number; posts: number; comments: number };
}

export interface TrendingCommunitiesResponse {
    communities: TrendingCommunity[];
    computed_at: string | null;
}

export interface TrendingTopic {
    kind: 'term' | 'flair';
    term: string;
    community: string | null;
    posts: number;
    authors: number;
}

export interface TrendingTopicsResponse {
    topics: TrendingTopic[];
    computed_at: string | null;
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

export interface RelatedPost {
    short_id: string;
    slug: string;
    title: string;
    community: string;
    score: number;
    comment_count: number;
}

export interface RelatedPostsResponse {
    related: RelatedPost[];
    more_from_community: RelatedPost[];
}

export interface SitemapIndexResponse {
    posts: { page: number; lastmod: string | null }[];
    communities: { page: number; lastmod: string | null }[];
    users: { page: number; lastmod: string | null }[];
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
    | 'scam'
    | 'harassment'
    | 'hate'
    | 'sexual'
    | 'violence'
    | 'misinformation'
    | 'personal_info'
    | 'other'
    // Older reports may carry these
    | 'self_harm'
    | 'illegal'
    | 'impersonation';

export type ReportTargetType = 'post' | 'comment' | 'user' | 'community' | 'ad';

// One entry in a mod queue: something with open reports, held by the filters, or both
export interface QueueItem {
    target_type: ReportTargetType;
    target_id: string;
    updated_at: string;
    held_reason: string | null;
    reports: { total: number; reasons: Partial<Record<ReportReason, number>>; notes: { note: string; reporter: string; created_at: string }[] };
    report_ids: string[];
    post?: Post;
    comment?: ListedComment;
    user?: { username: string; status: string; karma: number; created_at: string };
    community?: { name: string; display_name: string | null; status: string };
    ad?: { headline: string; advertiser: string; campaign_id: string; campaign: string; is_active: boolean };
}

export interface QueueResponse {
    items: QueueItem[];
}

export interface ModLogEntry {
    id: string;
    created_at: string;
    action: string;
    target_type: ReportTargetType;
    target_id: string;
    reason: string | null;
    details: Record<string, unknown> | null;
    actor: { username: string };
    community?: { name: string } | null;
}

export interface ModLogResponse {
    actions: ModLogEntry[];
    next_cursor: string | null;
}

export interface Restriction {
    username: string;
    until: string | null;
    reason: string | null;
}

export interface RestrictionsResponse {
    bans: Restriction[];
    mutes: Restriction[];
}

export interface AdminUser {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    karma: number;
    created_at: string;
    last_login_at: string | null;
    email_verified_at: string | null;
    suspended_until: string | null;
    suspension_reason: string | null;
    shadow_banned_at: string | null;
    _count: { posts: number; comments: number; reports_sent: number };
}

export interface AdminOverview {
    queue: number;
    users: number;
    new_users_24h: number;
    posts_24h: number;
    comments_24h: number;
    suspended: number;
    shadow_banned: number;
}

export interface AdminCommunity {
    id: string;
    name: string;
    display_name: string | null;
    status: string;
    visibility: string;
    category: string | null;
    is_nsfw: boolean;
    // null follows the default (no ads in sensitive categories)
    ads_enabled: boolean | null;
    member_count: number;
    post_count: number;
    created_at: string;
}

export interface BlockedTerm {
    id: string;
    kind: 'domain' | 'keyword';
    value: string;
    note: string | null;
    created_at: string;
    creator?: { username: string };
}

// Admin -> Stats (GET /admin/stats). Days are Lagos dates.
export interface DailyStats {
    date: string;
    total_users: number;
    new_signups: number;
    dau: number;
    wau: number;
    mau: number;
    unique_visitors: number;
    page_views: number;
    posts: number;
    comments: number;
    votes: number;
    ad_impressions: number;
    ad_clicks: number;
    house_impressions: number;
    house_clicks: number;
    countries: Record<string, number> | null;
}

export interface CommunityStats {
    name: string;
    display_name: string | null;
    members: number;
    new_members: number;
    posts: number;
    comments: number;
    votes: number;
    visitors: number;
    page_views: number;
}

export interface AdminStatsResponse {
    range: { from: string; to: string };
    today: DailyStats;
    days: DailyStats[];
    top_communities: CommunityStats[];
}
