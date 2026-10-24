import { AD_SEEN_COOKIE } from './config';

// Frequency caps: how many times this browser saw each capped campaign today, kept in a small cookie on the web
// app's domain ("2026-10-24|campaignId:2,campaignId:1"). The server passes the counts to the API, which skips
// campaigns that have reached their cap. Only campaigns with a cap are tracked.

const today = () => new Date().toISOString().slice(0, 10);
const MAX_ENTRIES = 20;

function parse(value: string | undefined): Map<string, number> {
    const [day, list] = (value ?? '').split('|');
    const counts = new Map<string, number>();
    if (day !== today() || !list) return counts;
    for (const part of list.split(',')) {
        const [id, n] = part.split(':');
        if (id && Number(n) > 0) counts.set(id, Number(n));
    }
    return counts;
}

// The "id:n,id:n" list the API takes, or '' when nothing counts today
export function readSeen(value: string | undefined): string {
    return [...parse(value)].map(([id, n]) => `${id}:${n}`).join(',');
}

export function recordSeen(campaignId: string) {
    const current = document.cookie.split('; ').find((row) => row.startsWith(`${AD_SEEN_COOKIE}=`));
    const counts = parse(current ? decodeURIComponent(current.slice(AD_SEEN_COOKIE.length + 1)) : undefined);
    counts.set(campaignId, (counts.get(campaignId) ?? 0) + 1);
    const list = [...counts].slice(-MAX_ENTRIES).map(([id, n]) => `${id}:${n}`).join(',');
    document.cookie = `${AD_SEEN_COOKIE}=${encodeURIComponent(`${today()}|${list}`)}; path=/; max-age=86400; samesite=lax`;
}
