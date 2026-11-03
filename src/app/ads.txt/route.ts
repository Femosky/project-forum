import { adsensePublisherId } from '@/lib/adsense';

// ads.txt: tells ad buyers that Google is allowed to sell this site's ad space, so AdSense can fill it at full price.
// Set ADSENSE_PUBLISHER_ID (pub-…) in the deploy environment; without it there is no file.
export const dynamic = 'force-dynamic';

export function GET() {
    const publisher = adsensePublisherId();
    if (!publisher) return new Response('Not found', { status: 404 });
    // f08c47fec0942fa0 is Google's fixed certification authority id
    return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
