// Shapes returned by the backend API. Anonymous, deleted and removed content
// comes back with author_ref set to null.

export interface AuthorRef {
    username: string;
    avatar_id: string;
}

export interface CommunityRef {
    name: string;
}

export interface Pagination {
    current_page: number;
    total_pages: number;
    total_items: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    next_page: number | null;
    previous_page: number | null;
}

export interface Post {
    id: string;
    short_id: string;
    slug: string;
    title: string;
    content: string;
    summary?: string | null;
    ai_summary?: string | null;
    created_at: string;
    is_anonymous: boolean;
    status: string;
    community_id: string;
    author_ref: AuthorRef | null;
    community_ref: CommunityRef;
    _count: { comments: number; upvoters: number; downvoters: number };
}

export interface Comment {
    id: string;
    short_id: string;
    post_id: string;
    parent_comment_id: string | null;
    content: string;
    created_at: string;
    is_edited: boolean;
    edited_at: string | null;
    is_anonymous: boolean;
    status: string;
    author_ref: AuthorRef | null;
    child_comments?: Comment[];
    _count: { child_comments: number; upvoters: number; downvoters: number };
}

export interface Community {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    _count?: { members: number; posts: number };
}

export interface PostsResponse {
    posts: Post[];
    pagination: Pagination;
}

export interface PostDetailResponse {
    post: Post;
    comments: Comment[];
    pagination: Pagination;
}

export interface CommentsResponse {
    comments: Comment[];
    pagination: Pagination;
}

export interface CreateCommentResponse {
    message: string;
    comment: Comment;
}

export interface CommunitiesResponse {
    communities: Community[];
}

export interface CommunityResponse {
    community: Community;
}
