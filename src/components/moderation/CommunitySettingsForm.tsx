'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import InputField, { selectStyles } from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ImageUpload from '@/components/common/ImageUpload';
import CommunityIconPicker from './CommunityIconPicker';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { COMMUNITY_CATEGORIES } from '@/lib/moderation';
import { Community, CommunityRule } from '@/types/api';

const MAX_RULES = 15;

// What a community shows in its about panel: display name, description, directory category and rules
export function CommunitySettingsForm({ community }: { community: Community }) {
    const router = useRouter();
    const [nameStyled, setNameStyled] = useState(community.name_styled || community.name);
    const [displayName, setDisplayName] = useState(community.display_name ?? '');
    const [iconUrl, setIconUrl] = useState(community.image_url);
    const [bannerUrl, setBannerUrl] = useState(community.banner_url);
    // Only the capitals of the handle can change: c/premierleague can become c/PremierLeague, never another name
    const styleError = nameStyled.trim().toLowerCase() === community.name ? null : `Only capital letters can change: it must spell "${community.name}".`;
    const [description, setDescription] = useState(community.description ?? '');
    const [category, setCategory] = useState(community.category ?? '');
    const [rules, setRules] = useState<CommunityRule[]>(community.rules ?? []);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [error, setError] = useState<string | null>(null);

    const updateRule = (index: number, field: keyof CommunityRule, value: string) =>
        setRules((current) => current.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)));

    function moveRule(index: number, by: -1 | 1) {
        setRules((current) => {
            const next = [...current];
            [next[index], next[index + by]] = [next[index + by], next[index]];
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (styleError) return;
        setStatus('saving');
        setError(null);
        try {
            await api(`/communities/${community.name}`, {
                method: 'PATCH',
                body: {
                    name_styled: nameStyled.trim(),
                    image_url: iconUrl,
                    banner_url: bannerUrl,
                    display_name: displayName.trim() || null,
                    description: description.trim() || null,
                    category: category || null,
                    rules: rules
                        .map((rule) => ({ title: rule.title.trim(), description: rule.description.trim() }))
                        .filter((rule) => rule.title),
                },
            });
            setStatus('saved');
            router.refresh();
        } catch (error) {
            setError(errorMessage(error));
            setStatus('idle');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4" noValidate>
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Icon and banner</span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <ImageUpload
                        endpoint={`/images?purpose=community_icon&community=${community.name}`}
                        aspect="square"
                        label="Icon"
                        value={iconUrl}
                        onChange={(url) => {
                            setIconUrl(url);
                            setStatus('idle');
                        }}
                    />
                    <div className="min-w-0 flex-1">
                        <ImageUpload
                            endpoint={`/images?purpose=community_banner&community=${community.name}`}
                            aspect="banner"
                            label="Banner"
                            value={bannerUrl}
                            onChange={(url) => {
                                setBannerUrl(url);
                                setStatus('idle');
                            }}
                        />
                    </div>
                </div>
                <p className="text-xs text-muted">Square icon; the banner is cut to 4:1. Saved with the button below.</p>
                <CommunityIconPicker
                    name={community.name_styled ?? community.name}
                    description={community.description}
                    value={iconUrl}
                    onChange={(url) => {
                        setIconUrl(url);
                        setStatus('idle');
                    }}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="name_styled" className="text-sm font-semibold">
                    Name style
                </label>
                <InputField
                    id="name_styled"
                    name="name_styled"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={21}
                    aria-invalid={Boolean(styleError)}
                    aria-describedby="name_styled_hint"
                    value={nameStyled}
                    onChange={(e) => {
                        setNameStyled(e.target.value.replace(/\s/g, ''));
                        setStatus('idle');
                    }}
                />
                <p id="name_styled_hint" className={styleError ? 'text-xs text-brand-text' : 'text-xs text-muted'}>
                    {styleError ?? `How the name shows: c/${nameStyled.trim() || community.name}. The link stays /c/${community.name}.`}
                </p>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="display_name" className="text-sm font-semibold">
                    Display name
                </label>
                <InputField name="display_name" placeholder={community.name} maxLength={50} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={selectStyles}
                >
                    <option value="">None</option>
                    {COMMUNITY_CATEGORIES.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-sm font-semibold">Rules</legend>
                {rules.length === 0 && <p className="text-sm text-muted">No rules yet. Short, clear rules make moderating easier to explain.</p>}
                <ol className="flex flex-col gap-3">
                    {rules.map((rule, index) => (
                        <li key={index} className="flex gap-2">
                            <span className="w-5 pt-3 text-sm font-bold text-muted">{index + 1}.</span>
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <InputField
                                    name={`rule-${index}`}
                                    aria-label={`Rule ${index + 1}`}
                                    placeholder="Rule, e.g. No job ads without a salary range"
                                    maxLength={100}
                                    value={rule.title}
                                    onChange={(e) => updateRule(index, 'title', e.target.value)}
                                />
                                <TextArea
                                    name={`rule-${index}-details`}
                                    aria-label={`Rule ${index + 1} details`}
                                    placeholder="Details (optional)"
                                    maxLength={500}
                                    className="min-h-16"
                                    value={rule.description}
                                    onChange={(e) => updateRule(index, 'description', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col">
                                <IconButton size="sm" aria-label="Move up" disabled={index === 0} onClick={() => moveRule(index, -1)}>
                                    <ArrowUp />
                                </IconButton>
                                <IconButton size="sm" aria-label="Move down" disabled={index === rules.length - 1} onClick={() => moveRule(index, 1)}>
                                    <ArrowDown />
                                </IconButton>
                                <IconButton size="sm" aria-label={`Delete rule ${index + 1}`} onClick={() => setRules((current) => current.filter((_, i) => i !== index))}>
                                    <Trash2 />
                                </IconButton>
                            </div>
                        </li>
                    ))}
                </ol>
                {rules.length < MAX_RULES && (
                    <Button variant="secondary" size="sm" className="self-start" onClick={() => setRules((current) => [...current, { title: '', description: '' }])}>
                        <Plus className="size-4" /> Add a rule
                    </Button>
                )}
            </fieldset>

            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            <div className="flex items-center justify-end gap-3">
                {status === 'saved' && <span className="text-sm text-muted">Saved</span>}
                <Button type="submit" disabled={status === 'saving' || Boolean(styleError)}>
                    {status === 'saving' ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
}

export default CommunitySettingsForm;
