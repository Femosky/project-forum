import { APP_NAME } from '@/lib/constants';

// The admin panel, its sign-in and invite pages are never indexed
export const metadata = { title: `Admin | ${APP_NAME}`, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
