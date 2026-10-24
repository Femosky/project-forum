// What the API's ad decision service returns (GET /v1/ads). Pages never look inside: they hand units to
// FeedAdSlot / ThreadAdSlot, which pick the right card.

export type AdPlacement = 'feed' | 'thread';

export type NativeCreative = {
    advertiser_name: string;
    advertiser_logo: string | null;
    title: string;
    body: string | null;
    image_url: string | null;
    cta_label: string;
    display_url: string;
};

export type NativeAdUnit = {
    kind: 'direct' | 'house';
    id: string;
    campaign_id: string;
    frequency_cap: number | null;
    creative: NativeCreative;
};

export type AdSenseUnit = {
    kind: 'adsense';
    id: string;
    client: string;
    slot_id: string;
    format: 'in-feed' | 'in-article';
    layout_key: string | null;
};

export type AdUnit = NativeAdUnit | AdSenseUnit;

export type AdsResponse = { ads: AdUnit[] };

// --- Admin (GET /v1/admin/ads and /v1/admin/ads/campaigns/:id) ---

export type Targeting = { communities: string[]; categories: string[] };

export type Campaign = {
    id: string;
    advertiser_id: string;
    name: string;
    kind: 'direct' | 'house';
    status: 'draft' | 'active' | 'paused' | 'ended';
    starts_at: string | null;
    ends_at: string | null;
    targeting: Targeting;
    pricing_model: 'cpm' | 'flat';
    budget_minor: number | null;
    price_minor: number | null;
    currency: string;
    frequency_cap: number | null;
    priority: number;
    payment_url: string | null;
    paid_at: string | null;
    stats_token: string | null;
    created_at: string;
    spent_minor?: number | null;
};

export type CampaignSummary = Campaign & { creative_count: number; active_creatives: number; impressions: number; clicks: number };

export type Advertiser = {
    id: string;
    name: string;
    contact_email: string | null;
    logo_url: string | null;
    website: string | null;
    notes: string | null;
};

export type AdsOverview = {
    ads_enabled: boolean;
    adsense: { enabled: boolean; configured: boolean };
    advertisers: (Advertiser & { campaigns: CampaignSummary[] })[];
};

export type Creative = {
    id: string;
    campaign_id: string;
    format: 'feed_post' | 'thread_comment';
    headline: string;
    body: string | null;
    image_url: string | null;
    click_url: string;
    cta_label: string;
    is_active: boolean;
    impressions: number;
    clicks: number;
};

export type CampaignDetail = {
    campaign: Campaign;
    advertiser: Advertiser;
    creatives: Creative[];
    days: { date: string; impressions: number; clicks: number }[];
};

export type AdStatsResponse = {
    campaign: { name: string; advertiser: string; status: Campaign['status']; starts_at: string | null; ends_at: string | null; pricing_model: Campaign['pricing_model']; currency: string };
    totals: { impressions: number; clicks: number };
    days: { date: string; impressions: number; clicks: number }[];
    creatives: { headline: string; format: Creative['format']; is_active: boolean; impressions: number; clicks: number }[];
};
