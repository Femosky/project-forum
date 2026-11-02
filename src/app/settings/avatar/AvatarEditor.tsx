'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shuffle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { AvatarConfig, avatarUrl, parseAvatarCode } from '@/avatars/code';
import { AVATAR_LOOKS, AVATAR_OPTIONS, AvatarPart, DARKEST_SKIN, PALE_EYES, renderAvatarConfig } from '@/avatars/parts';
import { UserResponse } from '@/types/api';

const svgUrl = (config: AvatarConfig, reply = false, threadPx?: number) => `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatarConfig(config, reply, threadPx))}`;

// One tab per thing a person thinks about, each holding the choices that belong together
const GROUPS: { id: string; label: string; parts: AvatarPart[] }[] = [
    { id: 'skin', label: 'Skin', parts: ['skin'] },
    { id: 'hair', label: 'Hair', parts: ['hair_colour', 'hair'] },
    { id: 'face', label: 'Face', parts: ['eyes', 'mouth', 'beard', 'eyewear'] },
    { id: 'wears', label: 'Wears', parts: ['cloth', 'top', 'neck'] },
    { id: 'thread', label: 'Thread', parts: ['thread', 'thread_style'] },
    { id: 'background', label: 'Background', parts: ['background'] },
];

const one = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// Mostly natural skin and hair colours, with accessories now and then
function shuffled(): AvatarConfig {
    const parts = Object.keys(AVATAR_OPTIONS) as AvatarPart[];
    const config = Object.fromEntries(parts.map((part) => [part, one(AVATAR_OPTIONS[part].options).id]));
    if (Math.random() < 0.88) config.skin = one(AVATAR_OPTIONS.skin.options.slice(0, 8)).id;
    if (Math.random() < 0.8) config.hair_colour = one(AVATAR_OPTIONS.hair_colour.options.slice(0, 3)).id;
    for (const part of ['neck', 'eyewear', 'beard'] as const) if (Math.random() < 0.7) config[part] = 'none';
    return config;
}

// The whole page for making an avatar: the picture stays in view while the choices change beside it
export default function AvatarEditor({ code }: { code: string | null }) {
    const router = useRouter();
    const [config, setConfig] = useState<AvatarConfig>(() => {
        const parsed = code ? parseAvatarCode(code) : null;
        return parsed && !('starter' in parsed) ? parsed : {};
    });
    const [group, setGroup] = useState('looks');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const untouched = Object.keys(config).length === 0;
    const showThread = group === 'thread';
    const parts = GROUPS.find(({ id }) => id === group)?.parts ?? [];
    const set = (part: AvatarPart, id: string) => setConfig({ ...config, [part]: id });

    const looks = useMemo(() => AVATAR_LOOKS.map((look) => ({ ...look, preview: svgUrl(look.config) })), []);
    const paleBlocked = DARKEST_SKIN.includes(config.skin);

    async function save() {
        setSaving(true);
        setError(null);
        try {
            await api<UserResponse>('/users/me', { method: 'PATCH', body: { avatar_config: config } });
            router.push('/settings');
            router.refresh();
        } catch (error) {
            setError(errorMessage(error));
            setSaving(false);
        }
    }

    return (
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8">
            <aside className="flex shrink-0 flex-col items-center gap-3 md:sticky md:top-20 md:w-56">
                <h1 className="self-start text-xl font-semibold">Your avatar</h1>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={untouched && code ? avatarUrl(code, showThread) : svgUrl(config, showThread, 3)}
                    alt="Your avatar"
                    width={200}
                    height={200}
                    className="size-48 rounded-full ring-1 ring-border md:size-56"
                />
                <Button variant="secondary" size="sm" onClick={() => setConfig(shuffled())}>
                    <Shuffle className="size-4" /> Shuffle
                </Button>
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                <div className="flex w-full gap-2">
                    <Button className="flex-1" onClick={save} disabled={saving || untouched}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/settings">Cancel</Link>
                    </Button>
                </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col gap-5">
                <nav aria-label="Avatar choices" className="flex flex-wrap gap-1">
                    {[{ id: 'looks', label: 'Looks' }, ...GROUPS].map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={group === id}
                            onClick={() => setGroup(id)}
                            className={twMerge(
                                'h-9 cursor-pointer rounded-full px-3.5 text-sm font-semibold transition-colors',
                                group === id ? 'bg-text text-bg' : 'text-muted hover:bg-surface-muted hover:text-text'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                {group === 'looks' && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
                        {looks.map((look) => (
                            <button key={look.name} type="button" onClick={() => setConfig(look.config)} className="flex cursor-pointer flex-col items-center gap-1.5 text-xs text-muted hover:text-text">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={look.preview} alt="" width={88} height={88} className="size-[88px] rounded-full ring-1 ring-border" />
                                {look.name}
                            </button>
                        ))}
                    </div>
                )}

                {parts.map((part) => {
                    const { label, options } = AVATAR_OPTIONS[part];
                    const swatches = options.every((option) => option.swatch);
                    return (
                        <div key={part} className="flex flex-col gap-2">
                            {parts.length > 1 && <h2 className="text-[13px] font-semibold text-muted">{label}</h2>}
                            <div role="radiogroup" aria-label={label} className={swatches ? 'flex flex-wrap gap-2' : 'grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3'}>
                                {options.map((option) => {
                                    const selected = config[part] === option.id;
                                    const blocked = part === 'eyes' && paleBlocked && PALE_EYES.includes(option.id);
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            aria-label={option.name}
                                            disabled={blocked}
                                            title={blocked ? 'Not available with this skin colour' : undefined}
                                            onClick={() => set(part, option.id)}
                                            className={twMerge('flex cursor-pointer flex-col items-center gap-1 text-xs leading-tight text-muted disabled:cursor-not-allowed disabled:opacity-40', selected && 'text-text')}
                                        >
                                            {swatches ? (
                                                <span className={twMerge('size-9 rounded-full ring-1 ring-black/10', selected && 'ring-2 ring-text ring-offset-2 ring-offset-bg')} style={{ background: option.swatch }} />
                                            ) : (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={svgUrl({ ...config, [part]: option.id }, part === 'thread_style', 4)} alt="" width={76} height={76} className={twMerge('size-[76px] rounded-full ring-1 ring-border', selected && 'ring-2 ring-text')} />
                                                    {option.name}
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </section>
        </main>
    );
}
