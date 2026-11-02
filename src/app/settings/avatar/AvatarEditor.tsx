'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Redo2, Shuffle, Undo2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { AvatarConfig, avatarUrl, parseAvatarCode } from '@/avatars/code';
import { AVATAR_LOOKS, AVATAR_OPTIONS, AvatarPart, renderAvatarConfig, STARTERS } from '@/avatars/parts';
import { UserResponse } from '@/types/api';

const svgUrl = (config: AvatarConfig, reply = false, threadPx?: number) => `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatarConfig(config, reply, threadPx, 'same'))}`;

// One tab per thing a person thinks about, each holding the choices that belong together
const GROUPS: { id: string; label: string; parts: AvatarPart[] }[] = [
    { id: 'skin', label: 'Skin', parts: ['skin'] },
    { id: 'hair', label: 'Hair', parts: ['hair_colour', 'hair'] },
    { id: 'face', label: 'Face', parts: ['eyes', 'mouth', 'beard', 'eyewear'] },
    { id: 'wears', label: 'Wears', parts: ['cloth', 'top', 'neck'] },
    { id: 'thread', label: 'Thread', parts: ['thread', 'thread_style'] },
    { id: 'background', label: 'Background', parts: ['background'] },
];

// The starter the API gives this username (Backend src/lib/avatars.ts)
function starterCode(name: string) {
    let hash = 2166136261;
    for (const char of name.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    return `s-${hash.toString(36)}`;
}

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
export default function AvatarEditor({ code, username }: { code: string | null; username: string }) {
    const router = useRouter();
    const [config, setPresent] = useState<AvatarConfig>(() => {
        const parsed = code ? parseAvatarCode(code) : null;
        // A starter assigned from the username has a number, not a name: nothing was chosen
        return parsed && (!('starter' in parsed) || STARTERS[parsed.starter]) ? (parsed as AvatarConfig) : {};
    });
    const [past, setPast] = useState<AvatarConfig[]>([]);
    const [future, setFuture] = useState<AvatarConfig[]>([]);
    const [group, setGroup] = useState('looks');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function setConfig(next: AvatarConfig) {
        setPast([...past, config]);
        setFuture([]);
        setPresent(next);
    }
    function undo() {
        setFuture([config, ...future]);
        setPresent(past[past.length - 1]);
        setPast(past.slice(0, -1));
    }
    function redo() {
        setPast([...past, config]);
        setPresent(future[0]);
        setFuture(future.slice(1));
    }

    // Nothing chosen means the member's starter avatar
    const untouched = Object.keys(config).length === 0;
    const starter = avatarUrl(starterCode(username));
    const showThread = group === 'thread';
    const parts = GROUPS.find(({ id }) => id === group)?.parts ?? [];
    const set = (part: AvatarPart, id: string) => setConfig({ ...dressed, [part]: id });

    // Choosing any part turns a starter into a dressed character
    const dressed = useMemo(() => Object.fromEntries(Object.entries(config).filter(([part]) => part !== 'starter')), [config]);
    const starters = useMemo(() => Object.keys(STARTERS).map((id) => ({ id, preview: svgUrl({ starter: id }) })), []);
    const looks = useMemo(() => AVATAR_LOOKS.map((look) => ({ ...look, preview: svgUrl(look.config) })), []);

    async function save() {
        setSaving(true);
        setError(null);
        try {
            await api<UserResponse>('/users/me', { method: 'PATCH', body: { avatar_config: untouched ? null : config } });
            router.push('/settings');
            router.refresh();
        } catch (error) {
            setError(errorMessage(error));
            setSaving(false);
        }
    }

    return (
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:h-[calc(100dvh-3.5rem)] md:flex-row md:items-start md:gap-8 md:overflow-hidden">
            <aside className="flex shrink-0 flex-col items-center gap-3 md:w-56">
                <h1 className="self-start text-xl font-semibold">Your avatar</h1>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={untouched ? starter : svgUrl(config, showThread, 0.9)}
                    alt="Your avatar"
                    width={200}
                    height={200}
                    className="size-48 rounded-full ring-1 ring-border md:size-56"
                />
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" aria-label="Undo" title="Undo" onClick={undo} disabled={past.length === 0}>
                        <Undo2 className="size-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfig(shuffled())}>
                        <Shuffle className="size-4" /> Shuffle
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Redo" title="Redo" onClick={redo} disabled={future.length === 0}>
                        <Redo2 className="size-4" />
                    </Button>
                </div>
                {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                <div className="flex w-full gap-2">
                    <Button className="flex-1" onClick={save} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/settings">Cancel</Link>
                    </Button>
                </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col gap-5 md:h-full md:overflow-y-auto md:p-1 md:pr-2 md:[scrollbar-gutter:stable]">
                <nav aria-label="Avatar choices" className="flex flex-wrap gap-1">
                    {[{ id: 'looks', label: 'Looks' }, { id: 'starters', label: 'Starters' }, ...GROUPS].map(({ id, label }) => (
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

                {group === 'starters' && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
                        <button type="button" onClick={() => setConfig({})} className="flex cursor-pointer flex-col items-center gap-1.5 text-xs text-muted hover:text-text">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={starter} alt="" width={88} height={88} className={twMerge('size-[88px] rounded-full ring-1 ring-border', untouched && 'ring-2 ring-text')} />
                            Original
                        </button>
                        {starters.map(({ id, preview }) => (
                            <button key={id} type="button" onClick={() => setConfig({ starter: id })} className="flex cursor-pointer flex-col items-center gap-1.5 text-xs capitalize text-muted hover:text-text">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt="" width={88} height={88} className={twMerge('size-[88px] rounded-full ring-1 ring-border', config.starter === id && 'ring-2 ring-text')} />
                                {id}
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
                            <div role="radiogroup" aria-label={label} className={swatches ? 'flex flex-wrap gap-2.5 p-1' : 'grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3'}>
                                {options.map((option) => {
                                    const selected = dressed[part] === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            aria-label={option.name}
                                            onClick={() => set(part, option.id)}
                                            className={twMerge('flex cursor-pointer flex-col items-center gap-1 text-xs leading-tight text-muted', selected && 'text-text')}
                                        >
                                            {swatches ? (
                                                <span className={twMerge('size-9 rounded-full ring-1 ring-black/10', selected && 'ring-2 ring-text ring-offset-2 ring-offset-bg')} style={{ background: option.swatch }} />
                                            ) : (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={svgUrl({ ...dressed, [part]: option.id }, part === 'thread_style', 1.3)} alt="" width={76} height={76} className={twMerge('size-[76px] rounded-full ring-1 ring-border', selected && 'ring-2 ring-text')} />
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
