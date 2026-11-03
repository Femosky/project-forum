import { APP_NAME } from '@/lib/constants';
import { noindexMetadata } from '@/lib/seo';

export const metadata = noindexMetadata(`Email settings | ${APP_NAME}`);

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
