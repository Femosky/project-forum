'use client';

import { useRef, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import ImageUpload from '@/components/common/ImageUpload';
import Button from '@/components/ui/Button';

// The 1.91:1 frame feed cards show pictures in (SponsoredPostCard)
const FRAME_RATIO = 1.91;

export type PictureFields = {
    image_url: string;
    image_focus_x: number;
    image_focus_y: number;
    image_fit: 'cover' | 'contain';
    use_link_image: boolean;
};

type LinkImage = {
    url: string | null;
    // When the API last looked; null means it will look when the ad is saved
    checkedAt: string | null;
    onRefresh?: () => Promise<void>;
};

// An ad's picture: upload it, then either pick what stays in view when it's cropped to the card, or show it whole.
// With no picture, the ad can use its link's preview image instead (fetched and stored by the API on save).
export default function AdPictureField({ value, onChange, linkImage }: { value: PictureFields; onChange: (next: PictureFields) => void; linkImage?: LinkImage }) {
    const shown = value.image_url || (value.use_link_image ? linkImage?.url : null) || null;
    const set = (patch: Partial<PictureFields>) => onChange({ ...value, ...patch });

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Picture (optional)</span>
                <p className="text-xs text-muted">
                    Best size: <strong>1200 × 630</strong> (the standard link-preview size). Other shapes get cropped, or shown whole on a
                    blurred backdrop: you choose below. JPEG, PNG, WebP or GIF, up to 5 MB.
                </p>
                <ImageUpload
                    endpoint="/admin/images?purpose=ad_image"
                    aspect="card"
                    label="Picture"
                    value={value.image_url || null}
                    onChange={(url) => set({ image_url: url ?? '', image_focus_x: 50, image_focus_y: 50 })}
                />
            </div>

            {!value.image_url && (
                <div className="flex flex-col gap-2 rounded-lg bg-surface-muted p-3 text-sm">
                    <label className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={value.use_link_image}
                            onChange={(e) => set({ use_link_image: e.target.checked })}
                            className="mt-0.5 size-4 accent-current"
                        />
                        <span>
                            Use the link&apos;s preview image when there&apos;s no picture
                            <span className="block text-xs text-muted">
                                The picture the link shows when it&apos;s shared. We keep a copy, so readers never load anything from the advertiser&apos;s
                                site. Off: a text-only ad.
                            </span>
                        </span>
                    </label>
                    {value.use_link_image && linkImage && <LinkImageStatus linkImage={linkImage} />}
                </div>
            )}

            {shown && (
                <div className="flex flex-col gap-2">
                    <div role="radiogroup" aria-label="How the picture fills the card" className="flex w-fit rounded-lg bg-surface-muted p-0.5 text-sm">
                        {(
                            [
                                ['cover', 'Fill the card (crop)'],
                                ['contain', 'Show the whole picture'],
                            ] as const
                        ).map(([fit, label]) => (
                            <button
                                key={fit}
                                type="button"
                                role="radio"
                                aria-checked={value.image_fit === fit}
                                onClick={() => set({ image_fit: fit })}
                                className={twMerge(
                                    'cursor-pointer rounded-md px-3 py-1.5 font-medium text-muted transition-colors',
                                    value.image_fit === fit && 'bg-surface text-text shadow-sm'
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {value.image_fit === 'cover' ? (
                        <FocusPicker src={shown} x={value.image_focus_x} y={value.image_focus_y} onChange={(x, y) => set({ image_focus_x: x, image_focus_y: y })} />
                    ) : (
                        <p className="text-xs text-muted">The whole picture shows, on a blurred copy of itself where it doesn&apos;t fill the card.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function LinkImageStatus({ linkImage }: { linkImage: LinkImage }) {
    const [busy, setBusy] = useState(false);
    const refresh = linkImage.onRefresh;
    return (
        <div className="flex items-center gap-3 text-xs text-muted">
            {linkImage.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={linkImage.url} alt="" className="aspect-[1.91/1] w-24 rounded-md object-cover ring-1 ring-border" />
            ) : null}
            <span className="flex-1">
                {linkImage.checkedAt === null ? 'Looked up when you save.' : linkImage.url ? 'Using the link’s preview image.' : 'The link has no preview image, so the ad shows text only.'}
            </span>
            {refresh && (
                <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                        setBusy(true);
                        try {
                            await refresh();
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    {busy ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Fetch again
                </Button>
            )}
        </div>
    );
}

// The whole picture, with the part the card will show outlined and the rest dimmed. Drag (or tap) to move it; arrow
// keys work too. The outline is exactly what object-position x% y% shows in a 1.91:1 frame.
function FocusPicker({ src, x, y, onChange }: { src: string; x: number; y: number; onChange: (x: number, y: number) => void }) {
    const box = useRef<HTMLDivElement>(null);
    const [ratio, setRatio] = useState<number | null>(null);

    // The visible window as fractions of the picture: full height and a slice of the width for wide pictures, and
    // the other way round for tall ones
    const w = ratio === null ? 1 : Math.min(1, FRAME_RATIO / ratio);
    const h = ratio === null ? 1 : Math.min(1, ratio / FRAME_RATIO);
    const left = (1 - w) * (x / 100);
    const top = (1 - h) * (y / 100);
    const croppable = w < 0.999 || h < 0.999;

    function moveTo(clientX: number, clientY: number) {
        const rect = box.current?.getBoundingClientRect();
        if (!rect) return;
        // Centre the window on the pointer, kept inside the picture
        const toFocus = (pointer: number, size: number) => {
            if (size >= 0.999) return 50;
            const start = Math.min(Math.max(pointer - size / 2, 0), 1 - size);
            return Math.round((start / (1 - size)) * 100);
        };
        onChange(toFocus((clientX - rect.left) / rect.width, w), toFocus((clientY - rect.top) / rect.height, h));
    }

    function onKeyDown(e: React.KeyboardEvent) {
        const step = e.shiftKey ? 20 : 5;
        const clamp = (value: number) => Math.min(Math.max(value, 0), 100);
        const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        const move = moves[e.key];
        if (!move) return;
        e.preventDefault();
        onChange(clamp(x + move[0]), clamp(y + move[1]));
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div
                ref={box}
                role="group"
                tabIndex={croppable ? 0 : -1}
                aria-label={`Part of the picture the card shows: ${x}% across, ${y}% down. Use the arrow keys to move it.`}
                onKeyDown={onKeyDown}
                onPointerDown={(e) => {
                    if (!croppable) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    moveTo(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => croppable && e.buttons === 1 && moveTo(e.clientX, e.clientY)}
                className={twMerge(
                    'relative w-full max-w-md touch-none select-none overflow-hidden rounded-lg bg-surface-muted ring-1 ring-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                    croppable && 'cursor-move'
                )}
                style={{ aspectRatio: ratio ?? FRAME_RATIO }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                    className="absolute inset-0 size-full object-contain"
                />
                {ratio !== null && croppable && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-white"
                        style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
                    />
                )}
            </div>
            <p className="text-xs text-muted">
                {ratio !== null && !croppable
                    ? 'This picture already has the card’s shape, so all of it shows.'
                    : 'Drag the bright area over the part that must show. Everything outside it is cut off, in the feed and in the small picture between comments.'}
            </p>
        </div>
    );
}
