import { twMerge } from 'tailwind-merge';
import { avatarUrl } from '@/avatars/code';

// A person's drawn avatar: a plain <img> of a cached SVG with its size set, so it costs no JavaScript and the row
// never moves when it loads. Someone hidden (anonymous, deleted) gets a quiet placeholder instead.
export function UserAvatar({
    user,
    size,
    className,
    reply = false,
}: {
    // `avatar` is the drawn avatar's code from the API (always set for real accounts)
    user: { username: string; avatar?: string | null } | null;
    size: number;
    className?: string;
    // On a reply: the picture whose thread reaches the left edge, where the reply line joins it
    reply?: boolean;
}) {
    if (!user || !user.avatar) return <span aria-hidden className={twMerge('inline-block shrink-0 rounded-full bg-surface-muted', className)} style={{ width: size, height: size }} />;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={avatarUrl(user.avatar, reply ? 'reply' : size >= 56 ? 'full' : undefined)}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            className={twMerge('shrink-0 rounded-full bg-surface-muted', className)}
        />
    );
}

export default UserAvatar;
