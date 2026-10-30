// Guest copy of the home page, for the edge cache (proxy.ts, "Guest pages at the edge"). Rendered without cookies or
// headers and kept for 60 seconds, so every signed-out reader shares it and the database is asked once a minute, not
// per visit.
import Page, { generateMetadata as metadataFor } from '@/app/page';

// The guest copy never has a query string (proxy.ts), and passing none keeps the render free of request data
const searchParams = Promise.resolve({});

export const generateMetadata = () => metadataFor({ searchParams });
export default function GuestPage() {
    return Page({ searchParams });
}

export const dynamic = 'force-static';
export const revalidate = 60;
