'use client';

import { useRef, useState } from 'react';
import { ImageUp, LoaderCircle, X } from 'lucide-react';
import { API_BASE } from '@/lib/constants';
import { errorMessage, toApiError } from '@/lib/api/errors';
import PostPicture from '@/components/post/PostPicture';
import type { PostImage } from '@/types/api';

const MAX_BYTES = 5 * 1024 * 1024;

// The picture for a picture post. Uploading stores a redrawn copy (location and camera data removed) after the
// automatic check; the post is checked again when it's sent.
export default function PictureField({ value, onChange, invalid }: { value: PostImage | null; onChange: (image: PostImage | null) => void; invalid?: boolean }) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload(file: File) {
        setError(null);
        if (file.size > MAX_BYTES) return setError('Pictures can be up to 5 MB.');
        setBusy(true);
        try {
            const response = await fetch(`${API_BASE}/images?purpose=post_image`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
                body: file,
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
                    <PostPicture image={value} maxHeight="22rem" />
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
            <p className="text-xs text-muted">JPEG, PNG, WebP or GIF, up to 5 MB. Location and camera details are removed. No sexual content.</p>
            {error && <p className="text-xs text-brand-text">{error}</p>}
        </div>
    );
}
