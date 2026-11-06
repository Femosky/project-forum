'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import InputField, { selectStyles } from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { AdminCommunity } from '@/types/api';

export type SeedAccount = { username: string; display_name: string | null };

// Opens a thread as one of the seed accounts (they have no password). Threads only: replies to real people come from
// real accounts.
export function SeedPost({ accounts, communities }: { accounts: SeedAccount[]; communities: AdminCommunity[] }) {
    const active = communities.filter((community) => community.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
    const [as, setAs] = useState(accounts[0]?.username ?? '');
    const [community, setCommunity] = useState(active[0]?.name ?? '');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posted, setPosted] = useState<{ title: string; path: string; as: string }[]>([]);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const { post } = await api<{ post: { path: string } }>('/admin/seed-posts', { method: 'POST', body: { as, community, title: title.trim(), body: body.trim() } });
            setPosted((current) => [{ title: title.trim(), path: post.path, as }, ...current]);
            setTitle('');
            setBody('');
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    if (accounts.length === 0) return <p className="text-sm text-muted">There are no seed accounts.</p>;

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4" noValidate>
                <p className="text-sm text-muted">
                    Open a new thread as a seed account. Answer real people from your own account, not from here.
                </p>
                <div className="flex flex-wrap gap-2">
                    <select aria-label="Post as" value={as} onChange={(e) => setAs(e.target.value)} className={twMerge(selectStyles, 'w-auto min-w-40 flex-1')}>
                        {accounts.map((account) => (
                            <option key={account.username} value={account.username}>
                                {account.display_name ? `${account.display_name} (u/${account.username})` : `u/${account.username}`}
                            </option>
                        ))}
                    </select>
                    <select aria-label="Community" value={community} onChange={(e) => setCommunity(e.target.value)} className={twMerge(selectStyles, 'w-auto min-w-40 flex-1')}>
                        {active.map((item) => (
                            <option key={item.id} value={item.name}>
                                {item.display_name ?? item.name} (c/{item.name})
                            </option>
                        ))}
                    </select>
                </div>
                <InputField name="title" aria-label="Title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <TextArea name="body" aria-label="Post" placeholder="Post (Markdown works)" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32" />
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                <div>
                    <Button type="submit" disabled={busy || title.trim().length < 3 || !community}>
                        <Send className="size-4" /> Post
                    </Button>
                </div>
            </form>
            {posted.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                    {posted.map((item) => (
                        <li key={item.path}>
                            Posted as u/{item.as}:{' '}
                            <Link href={item.path} className="font-medium underline">
                                {item.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
