import { APP_NAME } from '@/lib/constants';

export const metadata = { title: `Log in | ${APP_NAME}` };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
