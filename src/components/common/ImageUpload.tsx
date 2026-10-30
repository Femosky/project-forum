'use client';

import { useRef, useState } from 'react';
import { ImageUp, LoaderCircle, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { API_BASE } from '@/lib/constants';
import { errorMessage, toApiError } from '@/lib/api/errors';

export type UploadedImage = { url: string; width: number; height: number };

type ImageUploadProps = {
    // Where the picture goes: /images?purpose=community_icon&community=x or /admin/images?purpose=ad_logo
    endpoint: string;
    value: string | null;
    onChange: (url: string | null) => void;
    // Shape of the preview box, matching where the picture is shown
    aspect: 'square' | 'banner' | 'card';
    label: string;
};

const ASPECT = { square: 'aspect-square w-20', banner: 'aspect-[4/1] w-full', card: 'aspect-[1.91/1] w-full max-w-sm' };
const MAX_BYTES = 5 * 1024 * 1024;

// Pick a picture, see it, replace or remove it. The API checks it, strips its metadata and stores WebP copies; this
// only sends the file. JPEG, PNG, WebP or GIF up to 5 MB.
export default function ImageUpload({ endpoint, value, onChange, aspect, label }: ImageUploadProps) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload(file: File) {
        setError(null);
        if (file.size > MAX_BYTES) return setError('Pictures can be up to 5 MB.');
        setBusy(true);
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
                body: file,
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) throw toApiError(response.status, data);
            onChange((data as { image: UploadedImage }).image.url);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setBusy(false);
            if (input.current) input.current.value = '';
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-end gap-3">
                <button
                    type="button"
                    onClick={() => input.current?.click()}
                    aria-label={value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
                    className={twMerge(
                        'relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-surface-muted text-muted ring-1 ring-inset ring-border transition-colors hover:ring-border-strong',
                        ASPECT[aspect]
                    )}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {value && <img src={value} alt="" className="absolute inset-0 size-full object-cover" />}
                    {busy ? <LoaderCircle className="relative size-5 animate-spin" /> : !value && <ImageUp className="size-5" />}
                </button>
                {value && !busy && (
                    <button type="button" onClick={() => onChange(null)} className="flex cursor-pointer items-center gap-1 text-xs text-muted hover:text-text">
                        <X className="size-3.5" /> Remove
                    </button>
                )}
            </div>
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            {error && <p className="text-xs text-brand-text">{error}</p>}
        </div>
    );
}
