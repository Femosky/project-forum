'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import InputField, { selectStyles } from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { COMMUNITY_CATEGORIES } from '@/lib/moderation';
import { CommunityResponse } from '@/types/api';

// Same rule as the API's communityName (src/shared/validation.ts)
const NAME = /^[A-Za-z][A-Za-z0-9]{2,20}$/;

export function NewCommunityForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isMature, setIsMature] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nameError = name && !NAME.test(name) ? '3 to 21 letters and numbers, starting with a letter. No spaces.' : null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!NAME.test(name)) return setError('Choose a name first.');
        setIsSaving(true);
        setError(null);
        try {
            const { community } = await api<Pick<CommunityResponse, 'community'>>('/communities', {
                method: 'POST',
                body: {
                    name,
                    display_name: displayName.trim() || undefined,
                    description: description.trim() || undefined,
                    category: category || undefined,
                    visibility: isPrivate ? 'private' : 'public',
                    is_nsfw: isMature,
                },
            });
            router.push(`/c/${community.name}/mod?tab=settings`);
        } catch (error) {
            setError(errorMessage(error));
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4" noValidate>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-semibold">
                    Name
                </label>
                <InputField
                    id="name"
                    name="name"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={21}
                    placeholder="e.g. LagosFoodies"
                    aria-invalid={Boolean(nameError)}
                    aria-describedby="name_hint"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/\s/g, ''))}
                />
                <p id="name_hint" className={nameError ? 'text-xs text-brand-text' : 'text-xs text-muted'}>
                    {nameError ?? `The address will be /c/${name.toLowerCase() || 'name'}. Capitals are kept for show; the name can't change later.`}
                </p>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="display_name" className="text-sm font-semibold">
                    Display name <span className="font-normal text-muted">(optional)</span>
                </label>
                <InputField id="display_name" name="display_name" placeholder="e.g. Lagos Foodies" maxLength={50} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-semibold">
                    Description
                </label>
                <TextArea id="description" name="description" placeholder="What this community is for" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-sm font-semibold">
                    Directory category
                </label>
                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectStyles}>
                    <option value="">None</option>
                    {COMMUNITY_CATEGORIES.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-0.5 size-4 accent-accent" />
                <span>
                    <span className="font-semibold">Private</span>
                    <span className="block text-muted">Only members can read it, and people ask to join.</span>
                </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} className="mt-0.5 size-4 accent-accent" />
                <span>
                    <span className="font-semibold">Mature (18+)</span>
                    <span className="block text-muted">Every post is blurred for guests and for anyone who hasn&apos;t chosen to see mature posts.</span>
                </span>
            </label>

            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => router.back()} disabled={isSaving}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving || Boolean(nameError)}>
                    {isSaving ? 'Creating...' : 'Create community'}
                </Button>
            </div>
        </form>
    );
}

export default NewCommunityForm;
