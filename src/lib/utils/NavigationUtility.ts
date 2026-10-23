// Only same-site paths are allowed as a post-login destination ("//evil.com" is another site)
export function safeNextPath(next: string | null | undefined): string {
    if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/auth/')) return '/';
    return next;
}
