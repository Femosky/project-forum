'use client';

import { useRef, useState } from 'react';
import { ImageUp, LoaderCircle, X } from 'lucide-react';
import { API_BASE } from '@/lib/constants';
import { errorMessage, toApiError } from '@/lib/api/errors';
import PostPicture from '@/components/post/PostPicture';
import type { PostImage } from '@/types/api';

const MAX_BYTES = 5 * 1024 * 1024;
// The server keeps at most 2048 px on the long edge, so nothing bigger needs to travel
const MAX_SIDE = 2048;

// Shrinks a big photo in the browser before it's sent: long edge at most 2048 px, WebP at 0.8 (JPEG where the
// browser can't make WebP). A 4 MB phone photo goes up as a few hundred KB, which is quicker and cheaper on mobile
// data. GIFs go as they are (they may move), and so does anything already small. The server redraws it either way.
async function shrink(file: File): Promise<Blob> {
    if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && file.size < 1024 * 1024) return file;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.8));
        const webp = await encode('image/webp');
        const blob = webp?.type === 'image/webp' ? webp : await encode('image/jpeg');
        return blob && blob.size < file.size ? blob : file;
    } catch {
        return file;
    }
}

// The picture for a picture post. Uploading stores a redrawn copy (location and camera data removed) after the
// automatic check; the post is checked again when it's sent.
export default function PictureField({ value, onChange, invalid }: { value: PostImage | null; onChange: (image: PostImage | null) => void; invalid?: boolean }) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload(file: File) {
        setError(null);
        setBusy(true);
        try {
            const body = await shrink(file);
            if (body.size > MAX_BYTES) throw new Error('Pictures can be up to 5 MB.');
            const response = await fetch(`${API_BASE}/images?purpose=post_image`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': body.type || file.type || 'application/octet-stream' },
                body,
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) throw toApiError(response.status, data);
            onChange((data as { image: PostImage }).image);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setBusy(false);
            if (input.current) input.current.value = '';
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Picture</span>
            {value ? (
                <div className="flex flex-col gap-2">
                    <PostPicture image={value} maxHeight="22rem" sizes="(min-width: 768px) 600px, 100vw" />
                    <div className="flex gap-3 text-sm">
                        <button type="button" onClick={() => input.current?.click()} className="cursor-pointer font-semibold text-link hover:underline">
                            Replace
                        </button>
                        <button type="button" onClick={() => onChange(null)} className="flex cursor-pointer items-center gap-1 text-muted hover:text-text">
                            <X className="size-3.5" /> Remove
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => input.current?.click()}
                    disabled={busy}
                    className={`flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-surface-muted text-sm text-muted ring-1 ring-inset transition-colors hover:ring-border-strong ${invalid ? 'ring-danger' : 'ring-border'}`}
                >
                    {busy ? <LoaderCircle className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
                    {busy ? 'Uploading and checking…' : 'Choose a picture'}
                </button>
            )}
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <p className="text-xs text-muted">JPEG, PNG, WebP or GIF. Big photos are shrunk before they&apos;re sent. Location and camera details are removed. No sexual content.</p>
            {error && <p className="text-xs text-brand-text">{error}</p>}
        </div>
    );
}
