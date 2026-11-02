import Link from 'next/link';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { PrivateUser } from '@/types/api';

// Settings -> Avatar: the current picture and a link to the page that edits it
export default function AvatarSection({ user }: { user: PrivateUser }) {
    return (
        <div className="flex items-center gap-4">
            <UserAvatar user={{ username: user.username, avatar: user.avatar }} size={64} className="size-16" />
            <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">Pick a look. There are no photo uploads, so your avatar never shows who you are.</p>
                <Button variant="secondary" size="sm" className="self-start" asChild>
                    <Link href="/settings/avatar">Edit avatar</Link>
                </Button>
            </div>
        </div>
    );
}
