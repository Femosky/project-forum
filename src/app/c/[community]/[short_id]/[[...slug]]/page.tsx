import type { Metadata } from 'next';
import PostThread, { postMetadata } from '@/components/post/PostThread';

type PageProps = {
    params: Promise<{ community: string; short_id: string; slug?: string[] }>;
    // ?comment={id} shows just that comment and its replies (deep links, "continue this thread")
    searchParams: Promise<{ comment?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { short_id } = await params;
    return postMetadata(short_id);
}

export default async function PostPage({ params, searchParams }: PageProps) {
    const { community, short_id, slug } = await params;
    const { comment: focusId } = await searchParams;
    return <PostThread shortId={short_id} focusId={focusId} canonical={{ community, slug }} />;
}
