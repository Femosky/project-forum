'use client';

import { lazy, Suspense, useState, useSyncExternalStore } from 'react';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { PrivateUser } from '@/types/api';

const noSubscription = () => () => undefined;

// The editor (and every drawing it shows) downloads only when someone opens it
const AvatarEditor = lazy(() => import('./AvatarEditor'));

// Settings -> Avatar: the current picture and an "Edit avatar" button. Opens straight into the editor from a
// profile's "Edit avatar" link (/settings#avatar).
export default function AvatarSection({ user }: { user: PrivateUser }) {
    const [avatar, setAvatar] = useState(user.avatar);
    // null: not chosen yet, so a profile's "Edit avatar" link (/settings#avatar) opens straight into the editor. Read
    // without a render mismatch: the server always says no.
    const [choice, setEditing] = useState<boolean | null>(null);
    const fromLink = useSyncExternalStore(noSubscription, () => location.hash === '#avatar', () => false);
    const editing = choice ?? fromLink;

    if (editing) {
        return (
            <Suspense fallback={<div className="h-[420px]" />}>
                <AvatarEditor
                    username={user.username}
                    initial={avatar}
                    onDone={(code) => {
                        if (code !== undefined) setAvatar(code);
                        setEditing(false);
                    }}
                />
            </Suspense>
        );
    }
    return (
        <div className="flex items-center gap-4">
            <UserAvatar user={{ username: user.username, avatar }} size={64} className="size-16" />
            <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">Pick a look. There are no photo uploads, so your avatar never shows who you are.</p>
                <Button variant="secondary" size="sm" className="self-start" onClick={() => setEditing(true)}>
                    Edit avatar
                </Button>
            </div>
        </div>
    );
}
