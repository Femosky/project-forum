type SearchPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q: query } = await searchParams;
    const q = query ?? '';

    if (!q) {
        return <div>Type something to search</div>;
    }

    return <div>Search results for: {q}</div>;
}
