'use client';

import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { AvatarConfig, parseAvatarCode } from '@/avatars/code';
import { AVATAR_LOOKS, AVATAR_OPTIONS, AvatarPart, renderAvatarConfig } from '@/avatars/parts';
import { UserResponse } from '@/types/api';

const PARTS = Object.keys(AVATAR_OPTIONS) as AvatarPart[];
const svgUrl = (config: AvatarConfig, reply = false) => `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatarConfig(config, reply))}`;

const one = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// Mostly natural skin and hair colours, with accessories now and then
function shuffled(): AvatarConfig {
    const config = Object.fromEntries(PARTS.map((part) => [part, one(AVATAR_OPTIONS[part].options).id]));
    if (Math.random() < 0.88) config.skin = one(AVATAR_OPTIONS.skin.options.slice(0, 6)).id;
    if (Math.random() < 0.8) config.hair_colour = one(AVATAR_OPTIONS.hair_colour.options.slice(0, 3)).id;
    for (const part of ['neck', 'eyewear', 'beard'] as const) if (Math.random() < 0.7) config[part] = 'none';
    return config;
}

// Loaded on demand from Settings: a live preview, ready-made looks, a row of choices per part, Shuffle, and Save
export default function AvatarEditor({ initial, onDone }: { initial: AvatarConfig | null; onDone: (code?: string | null) => void }) {
    const [config, setConfig] = useState<AvatarConfig>(() => initial ?? AVATAR_LOOKS[0].config);
    const [part, setPart] = useState<AvatarPart | 'looks'>('looks');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const looks = useMemo(() => AVATAR_LOOKS.map((look) => ({ ...look, preview: svgUrl(look.config) })), []);
    const options = useMemo(
        () =>
            part === 'looks'
                ? []
                : AVATAR_OPTIONS[part].options.map((option) => ({
                      ...option,
                      preview: option.swatch ? null : svgUrl({ ...config, [part]: option.id }, part === 'thread_style'),
                  })),
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
                <img src={svgUrl(config)} alt="Your avatar" width={112} height={112} className="size-28 rounded-full ring-1 ring-border" />
                <Button variant="secondary" size="sm" onClick={() => setConfig(shuffled())}>
                    <Shuffle className="size-4" /> Shuffle
                </Button>
            </div>

            <nav aria-label="Avatar parts" className="flex flex-wrap gap-1">
                {(['looks', ...PARTS] as const).map((value) => (
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
                        {value === 'looks' ? 'Looks' : AVATAR_OPTIONS[value].label}
                    </button>
                ))}
            </nav>

            {part === 'looks' ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3">
                    {looks.map((look) => (
                        <button key={look.name} type="button" onClick={() => setConfig(look.config)} className="flex cursor-pointer flex-col items-center gap-1 text-xs text-muted hover:text-text">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={look.preview} alt="" width={72} height={72} className="size-[72px] rounded-full ring-1 ring-border" />
                            {look.name}
                        </button>
                    ))}
                </div>
            ) : (
                <div role="radiogroup" aria-label={AVATAR_OPTIONS[part].label} className="grid max-h-80 grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-2 overflow-y-auto p-1">
                    {options.map((option) => {
                        const selected = config[part] === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                aria-label={option.name}
                                onClick={() => setConfig({ ...config, [part]: option.id })}
                                className="flex cursor-pointer flex-col items-center gap-1 text-[11px] leading-tight text-muted"
                            >
                                {option.preview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={option.preview} alt="" width={56} height={56} className={twMerge('size-14 rounded-full ring-1 ring-border', selected && 'ring-2 ring-text')} />
                                ) : (
                                    <span className={twMerge('size-10 rounded-full ring-1 ring-black/10', selected && 'ring-2 ring-text')} style={{ background: option.swatch }} />
                                )}
                                {option.preview && option.name}
                            </button>
                        );
                    })}
                </div>
            )}

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
