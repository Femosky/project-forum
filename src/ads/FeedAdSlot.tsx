import AdSenseSlot from './AdSenseSlot';
import SponsoredPostCard from './SponsoredPostCard';
import type { AdUnit } from './types';

// One of the two ad components pages use (the other is ThreadAdSlot; they live apart so each page ships only
// its own card). Takes a unit from the decision service and renders the matching card, or nothing.
export function FeedAdSlot({ unit }: { unit: AdUnit | undefined }) {
    if (!unit) return null;
    return unit.kind === 'adsense' ? <AdSenseSlot unit={unit} placement="feed" /> : <SponsoredPostCard unit={unit} />;
}

export default FeedAdSlot;
