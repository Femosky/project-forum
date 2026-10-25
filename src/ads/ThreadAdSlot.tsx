import AdSenseSlot from './AdSenseSlot';
import SponsoredCommentItem from './SponsoredCommentItem';
import type { AdUnit } from './types';

// The in-thread counterpart of FeedAdSlot: a sponsored comment, an AdSense in-article unit, or nothing
export function ThreadAdSlot({ unit }: { unit: AdUnit | undefined }) {
    if (!unit) return null;
    return unit.kind === 'adsense' ? <AdSenseSlot unit={unit} placement="thread" className="px-0" /> : <SponsoredCommentItem unit={unit} />;
}

export default ThreadAdSlot;
