'use client';

import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { AVATAR_PARTS, AvatarConfig, AvatarPart, avatarFromName, decodeAvatar, PART_COUNTS } from '@/avatars/code';
import { COLOURS, PART_LABELS, renderAvatar } from '@/avatars/parts';
import { UserResponse } from '@/types/api';

// Colour parts are picked from swatches; the rest from small previews of the avatar with that one part changed
const SWATCHES: Partial<Record<AvatarPart, string[]>> = {
    skin: COLOURS.skin,
    hair_colour: COLOURS.hair_colour,
    outfit: COLOURS.outfit,
    background: COLOURS.background,
};

const svgUrl = (config: AvatarConfig) => `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatar(config))}`;

const shuffled = (): AvatarConfig =>
    Object.fromEntries(AVATAR_PARTS.map((part) => [part, Math.floor(Math.random() * PART_COUNTS[part])])) as AvatarConfig;

// Loaded on demand from Settings: a live preview, a row of choices per part, Shuffle, and Save
export default function AvatarEditor({ username, initial, onDone }: { username: string; initial: string | null; onDone: (code?: string | null) => void }) {
    const [config, setConfig] = useState<AvatarConfig>(() => (initial && decodeAvatar(initial)) || avatarFromName(username));
    const [part, setPart] = useState<AvatarPart>('hair');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const options = useMemo(
        () => Array.from({ length: PART_COUNTS[part] }, (_, index) => ({ index, preview: svgUrl({ ...config, [part]: index }) })),
        [config, part]
    );

    async function save() {
        setSaving(true);
        setError(null);
        try {
            const { user } = await api<UserResponse>('/users/me', { method: 'PATCH', body: { avatar_config: config } });
            onDone(user.avatar);
        } catch (error) {
            setError(errorMessage(error));
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={svgUrl(config)} alt="Your avatar" width={96} height={96} className="size-24 rounded-full ring-1 ring-border" />
                <Button variant="secondary" size="sm" onClick={() => setConfig(shuffled())}>
                    <Shuffle className="size-4" /> Shuffle
                </Button>
            </div>

            <nav aria-label="Avatar parts" className="flex flex-wrap gap-1">
                {AVATAR_PARTS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={part === value}
                        onClick={() => setPart(value)}
                        className={twMerge(
                            'h-8 cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors',
                            part === value ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                        )}
                    >
                        {PART_LABELS[value]}
                    </button>
                ))}
            </nav>

            <div role="radiogroup" aria-label={PART_LABELS[part]} className="flex flex-wrap gap-2">
                {options.map(({ index, preview }) => {
                    const swatch = SWATCHES[part]?.[index];
                    const selected = config[part] === index;
                    return (
                        <button
                            key={index}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={`${PART_LABELS[part]} ${index + 1}`}
                            onClick={() => setConfig({ ...config, [part]: index })}
                            className={twMerge(
                                'flex size-14 cursor-pointer items-center justify-center rounded-full ring-1 ring-border transition-shadow',
                                selected && 'ring-2 ring-text'
                            )}
                        >
                            {swatch ? (
                                <span className="size-9 rounded-full ring-1 ring-black/10" style={{ background: swatch }} />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={preview} alt="" width={52} height={52} className="size-[52px] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
            <div className="flex gap-2">
                <Button onClick={save} disabled={saving}>
                    {saving ? 'Saving...' : 'Save avatar'}
                </Button>
                <Button variant="ghost" onClick={() => onDone()}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
