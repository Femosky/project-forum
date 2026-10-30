// What the API's ad decision service returns (GET /v1/ads). Pages never look inside: they hand units to
// FeedAdSlot / ThreadAdSlot, which pick the right card.

export type AdPlacement = 'feed' | 'thread';

export type NativeCreative = {
    advertiser_name: string;
    advertiser_logo: string | null;
    title: string;
    body: string | null;
    image_url: string | null;
    // How the picture sits in its frame: crop around this point (percent across and down), or show it whole
    image_focus: { x: number; y: number };
    image_fit: 'cover' | 'contain';
    cta_label: string;
    // The advertiser's domain, or null when the ad leads to a page on this site (cards then show the site's name)
    display_url: string | null;
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
    // House campaigns: percent of slots (0-50) they take even when paid campaigns want them
    house_share: number;
    payment_url: string | null;
    paid_at: string | null;
    stats_token: string | null;
    created_at: string;
    spent_minor?: number | null;
};

export type CampaignSummary = Campaign & {
    creative_count: number;
    active_creatives: number;
    impressions: number;
    clicks: number;
    // From the API's ad-pictures release on; older APIs leave them out
    last_7_days?: { impressions: number; clicks: number };
    // Where its live ads run
    placements?: { feed: boolean; comments: boolean };
};

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
    // 'any' runs in both: the big card in feeds, the compact one between comments
    format: 'feed_post' | 'thread_comment' | 'any';
    headline: string;
    body: string | null;
    image_url: string | null;
    image_focus_x: number;
    image_focus_y: number;
    image_fit: 'cover' | 'contain';
    // With no picture: the destination's preview image (stored by the API) when switched on
    use_link_image: boolean;
    link_image_url: string | null;
    link_image_checked_at: string | null;
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
