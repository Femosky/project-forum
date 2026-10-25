'use client';

import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import InputField from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { Flair } from '@/types/api';

// Moderators only: the labels members can put on posts here
export function ManageFlairs({ community, initialFlairs }: { community: string; initialFlairs: Flair[] }) {
    const [flairs, setFlairs] = useState(initialFlairs);
    const [name, setName] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function add(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!name.trim()) return;
        setIsBusy(true);
        setError(null);
        try {
            const { flair } = await api<{ flair: Flair }>(`/communities/${community}/flairs`, { method: 'POST', body: { name: name.trim() } });
            setFlairs((current) => [...current, flair].sort((a, b) => a.name.localeCompare(b.name)));
            setName('');
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsBusy(false);
        }
    }

    async function remove(flair: Flair) {
        setError(null);
        setFlairs((current) => current.filter((item) => item.id !== flair.id));
        try {
            await api(`/communities/${community}/flairs/${flair.id}`, { method: 'DELETE' });
        } catch (error) {
            setFlairs((current) => [...current, flair].sort((a, b) => a.name.localeCompare(b.name)));
            setError(errorMessage(error));
        }
    }

    return (
        <details className="group border-b border-border bg-surface px-4 py-3 sm:mt-4 sm:rounded-[10px] sm:border">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
                <Tag className="size-4 text-muted" /> Post flairs
                <span className="font-normal text-muted">
                    ({flairs.length}) · moderators only
                </span>
            </summary>
            <div className="mt-3 flex flex-col gap-3">
                {flairs.length === 0 ? (
                    <p className="text-sm text-muted">No flairs yet. Add labels like &quot;Question&quot; or &quot;Guide&quot; that members can pick when posting.</p>
                ) : (
                    <ul className="flex flex-wrap gap-2">
                        {flairs.map((flair) => (
                            <li key={flair.id} className="flex items-center gap-1 rounded-full bg-surface-muted py-0.5 pl-3 pr-0.5 text-sm font-semibold">
                                {flair.name}
                                <IconButton size="sm" aria-label={`Delete flair ${flair.name}`} onClick={() => remove(flair)} className="size-7">
                                    <X />
                                </IconButton>
                            </li>
                        ))}
                    </ul>
                )}
                <form onSubmit={add} className="flex gap-2">
                    <InputField name="flair" aria-label="New flair" placeholder="New flair" maxLength={32} value={name} onChange={(e) => setName(e.target.value)} />
                    <Button type="submit" variant="secondary" disabled={isBusy || !name.trim()}>
                        Add
                    </Button>
                </form>
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            </div>
        </details>
    );
}

export default ManageFlairs;
