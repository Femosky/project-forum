import { twMerge } from 'tailwind-merge';
import type { NativeCreative } from './types';

type AdPictureProps = {
    src: string;
    focus?: NativeCreative['image_focus'];
    fit?: NativeCreative['image_fit'];
    // The frame: its size and shape (aspect ratio) are set by the caller, so the space is reserved before the picture
    // loads and nothing below it moves
    className?: string;
};

// An ad's picture in its frame. Pictures keep their own shape (the API doesn't cut them), so the frame decides:
// "cover" fills it, cropped around the focal point the admin picked; "contain" shows the whole picture on a blurred,
// enlarged copy of itself, so nothing is cut off and there are no empty bars.
export default function AdPicture({ src, focus, fit = 'cover', className }: AdPictureProps) {
    // An API from before focal points sends neither; the centre is what it used to show
    const position = `${focus?.x ?? 50}% ${focus?.y ?? 50}%`;
    return (
        <div className={twMerge('data-saver-hide relative overflow-hidden bg-surface-muted', className)}>
            {fit === 'contain' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-xl" />
            )}
            {/* Advertiser pictures come from our storage or an https link, so next/image's allow-list doesn't apply */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                loading="lazy"
                draggable={false}
                className={twMerge('absolute inset-0 size-full', fit === 'contain' ? 'object-contain' : 'object-cover')}
                style={fit === 'contain' ? undefined : { objectPosition: position }}
            />
        </div>
    );
}
