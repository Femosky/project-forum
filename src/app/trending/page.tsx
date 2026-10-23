import { APP_NAME } from '@/lib/constants';
import { noindexMetadata } from '@/lib/seo';
import ComingSoon from '@/components/common/ComingSoon';

export const metadata = noindexMetadata(`Trending | ${APP_NAME}`);

export default function TrendingPage() {
    return <ComingSoon title="Trending" description="The most active conversations right now will show up here." />;
}
