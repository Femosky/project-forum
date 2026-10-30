'use client';

import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { ICON_COLOURS, ICON_GLYPHS, IconColour, iconUrl, suggestIcons } from '@/data/communityIcons';

// Choosing an icon without uploading anything: a topic and a colour, with the ones that fit this community first
export function CommunityIconPicker({ name, description, value, onChange }: { name: string; description: string | null; value: string | null; onChange: (url: string) => void }) {
    const current = value?.match(/^\/community-icon\/([a-z]+)-([a-z]+)\.svg$/);
    const [colour, setColour] = useState<IconColour>((current?.[2] as IconColour) ?? 'indigo');
    const suggested = useMemo(() => suggestIcons(name, description), [name, description]);
    const others = useMemo(() => ICON_GLYPHS.filter((glyph) => !suggested.includes(glyph)), [suggested]);

    const tile = (glyph: { name: string; label: string }) => {
        const url = iconUrl(glyph.name, colour);
        return (
            <button
                key={glyph.name}
                type="button"
                title={glyph.label}
                aria-label={glyph.label}
                aria-pressed={current?.[1] === glyph.name}
                onClick={() => onChange(url)}
                className={twMerge('size-10 cursor-pointer overflow-hidden rounded-[28%] ring-offset-2 ring-offset-surface transition-transform hover:scale-105', current?.[1] === glyph.name && 'ring-2 ring-text')}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="size-full" />
            </button>
        );
    };

    return (
        <div className="mt-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">Or pick an icon</span>
                <div role="group" aria-label="Icon colour" className="ml-auto flex gap-1.5">
                    {(Object.keys(ICON_COLOURS) as IconColour[]).map((name) => (
                        <button
                            key={name}
                            type="button"
                            aria-label={name}
                            aria-pressed={colour === name}
                            onClick={() => {
                                setColour(name);
                                if (current) onChange(iconUrl(current[1], name));
                            }}
                            style={{ backgroundColor: ICON_COLOURS[name].line }}
                            className={twMerge('size-5 cursor-pointer rounded-full ring-offset-2 ring-offset-surface', colour === name && 'ring-2 ring-text')}
                        />
                    ))}
                </div>
            </div>
            {suggested.length > 0 && (
                <>
                    <span className="text-xs text-subtle">Suggested for this community</span>
                    <div className="flex flex-wrap gap-2">{suggested.map(tile)}</div>
                    <span className="text-xs text-subtle">All icons</span>
                </>
            )}
            <div className="flex flex-wrap gap-2">{others.map(tile)}</div>
        </div>
    );
}

export default CommunityIconPicker;
