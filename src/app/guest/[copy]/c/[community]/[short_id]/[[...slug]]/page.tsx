// Guest copy of a post page, for the edge cache (proxy.ts, "Guest pages at the edge"; the [copy] segment is always
// "shared"). Rendered without cookies or headers and kept for 60 seconds, so every signed-out reader shares it and
// the database is asked once a minute, not per visit.
import Page, { generateMetadata as metadataFor } from '@/app/c/[community]/[short_id]/[[...slug]]/page';

type Props = { params: Promise<{ community: string; short_id: string; slug?: string[] }> };

// The guest copy never has a query string (proxy.ts), and passing none keeps the render free of request data
const searchParams = Promise.resolve({});

export const generateMetadata = ({ params }: Props) => metadataFor({ params, searchParams });
export default function GuestPage({ params }: Props) {
    return Page({ params, searchParams });
}

export const dynamic = 'force-static';
export const revalidate = 60;
// Rendered on first visit, not at build time
export const generateStaticParams = () => [];
