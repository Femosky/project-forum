import { cookies } from 'next/headers';
import { serverApi } from '@/lib/api/server';
import { getDataSaver } from '@/lib/dataSaver';
import { AD_SEEN_COOKIE } from './config';
import { readSeen } from './frequency';
import type { AdPlacement, AdUnit, AdsResponse } from './types';

type Where = { community?: string; post?: string };

// Ads for the slots on a server-rendered page. Fetched alongside the page's data, so slots render with the page
// and nothing shifts later. Data saver drops AdSense (a heavy third-party script); native ads stay, minus images.
// Never throws: a page renders fine with no ads.
export async function loadAds(placement: AdPlacement, where: Where, count: number): Promise<AdUnit[]> {
    if (count <= 0) return [];
    const [cookieStore, dataSaver] = await Promise.all([cookies(), getDataSaver()]);
    const seen = readSeen(cookieStore.get(AD_SEEN_COOKIE)?.value);
    const query = new URLSearchParams({
        placement,
        count: String(Math.min(count, 6)),
        ...(where.community ? { community: where.community } : {}),
        ...(where.post ? { post: where.post } : {}),
        ...(seen ? { seen } : {}),
    });
    const { data } = await serverApi<AdsResponse>(`/ads?${query}`);
    const ads = data?.ads ?? [];
    return dataSaver.enabled ? ads.filter((ad) => ad.kind !== 'adsense') : ads;
}
