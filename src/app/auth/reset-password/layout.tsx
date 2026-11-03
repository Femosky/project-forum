import { APP_NAME } from '@/lib/constants';

export const metadata = { title: `Choose a new password | ${APP_NAME}` };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
