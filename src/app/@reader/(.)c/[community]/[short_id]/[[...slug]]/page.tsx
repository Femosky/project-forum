import type { Metadata } from 'next';
import PostThread, { postMetadata } from '@/components/post/PostThread';
import ReaderPane from '@/components/post/ReaderPane';

type PageProps = {
    params: Promise<{ community: string; short_id: string; slug?: string[] }>;
    searchParams: Promise<{ comment?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { short_id } = await params;
    return postMetadata(short_id);
}

// A post opened from inside the app: shown in the reading pane beside the page it was opened from.
// Loading the same URL directly renders the full post page instead (app/c/[community]/[short_id]).
export default async function ReaderPage({ params, searchParams }: PageProps) {
    const { community, short_id } = await params;
    const { comment: focusId } = await searchParams;
    return (
        <ReaderPane shortId={short_id} community={community}>
            <PostThread shortId={short_id} focusId={focusId} />
        </ReaderPane>
    );
}
