import Link from 'next/link';
import { Settings } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import AvatarEditor from './AvatarEditor';

export const metadata = { title: `Your avatar | ${APP_NAME}`, robots: { index: false } };

export default async function AvatarPage() {
    const me = await serverApi<UserResponse>('/auth/me');
    if (!me.data) {
        return (
            <EmptyState
                icon={<Settings />}
                title="Sign in to change your avatar"
                action={
                    <Button asChild>
                        <Link href="/auth/login?next=/settings/avatar">Log in</Link>
                    </Button>
                }
            />
        );
    }
    return <AvatarEditor code={me.data.user.avatar} />;
}
