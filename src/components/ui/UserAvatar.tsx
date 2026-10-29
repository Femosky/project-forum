import { twMerge } from 'tailwind-merge';
import { avatarUrl } from '@/avatars/code';

// A person's drawn avatar: a plain <img> of a cached SVG with its size set, so it costs no JavaScript and the row
// never moves when it loads. Someone hidden (anonymous, deleted) gets a quiet placeholder instead.
export function UserAvatar({
    user,
    size,
    className,
}: {
    user: { username: string; avatar?: string | null } | null;
    size: number;
    className?: string;
}) {
    if (!user) return <span aria-hidden className={twMerge('inline-block shrink-0 rounded-full bg-surface-muted', className)} style={{ width: size, height: size }} />;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={avatarUrl(user)}
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
