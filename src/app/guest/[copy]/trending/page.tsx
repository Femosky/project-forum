// Guest copy of /trending, for the edge cache (proxy.ts, "Guest pages at the edge"; the [copy] segment is always
// "shared"). Rendered without cookies or headers and kept for 60 seconds, so every signed-out reader shares it and
// the database is asked once a minute, not per visit.
export { default, metadata } from '@/app/trending/page';

export const dynamic = 'force-static';
export const revalidate = 60;
// Rendered on first visit, not at build time
export const generateStaticParams = () => [];
