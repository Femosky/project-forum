// The IndexNow key file. The API pings Bing and Yandex about new posts with this key; they fetch this file to
// check the ping came from the site's owner. INDEXNOW_KEY must match the API's.
export const dynamic = 'force-dynamic';

export function GET() {
    const key = process.env.INDEXNOW_KEY;
    if (!key) return new Response('Not found', { status: 404 });
    return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
