import { APP_NAME } from '@/lib/constants';
import { noindexMetadata } from '@/lib/seo';

// Sign-in and sign-up pages stay out of search results
export const metadata = noindexMetadata(APP_NAME);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children;
}
