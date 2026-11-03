// The AdSense publisher id from ADSENSE_PUBLISHER_ID, as "pub-…". Accepts the "ca-pub-…" form AdSense also shows.
export function adsensePublisherId(): string | null {
    const value = process.env.ADSENSE_PUBLISHER_ID?.trim().replace(/^ca-/, '');
    return value && /^pub-\d{10,20}$/.test(value) ? value : null;
}
