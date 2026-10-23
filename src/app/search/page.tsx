import EmptyState from '@/components/ui/EmptyState';
import { SearchIcon } from 'lucide-react';

type SearchPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q: query } = await searchParams;
    const q = query ?? '';

    // TODO(Phase 3): search input on mobile and real results from the API
    return (
        <EmptyState
            icon={<SearchIcon />}
            title={q ? `Results for "${q}"` : 'Search'}
            description={q ? 'Search results are on their way.' : 'Type something to search.'}
        />
    );
}
