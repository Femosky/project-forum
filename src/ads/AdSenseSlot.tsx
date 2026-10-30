'use client';

import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useDataSaver } from '@/lib/useDataSaver';
import { ADSENSE_HEIGHT } from './config';
import { useConsent } from '@/lib/consent';
import type { AdPlacement, AdSenseUnit } from './types';

declare global {
    interface Window {
        adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
    }
}

let scriptAdded = false;

function addScript(client: string) {
    if (scriptAdded) return;
    scriptAdded = true;
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    document.head.appendChild(script);
}

// An AdSense unit (in-feed or in-article). The box has a fixed height from the start, so the page never moves
// when the ad fills it (or doesn't). adsbygoogle.js loads only when a slot comes near the screen, after the reader
// has answered the cookie banner, and never with data saver on. Without the advertising choice, Google serves
// non-personalised ads (and Consent Mode, set in the layout, says the same).
export function AdSenseSlot({ unit, placement, className }: { unit: AdSenseUnit; placement: AdPlacement; className?: string }) {
    const box = useRef<HTMLDivElement>(null);
    const [isNear, setIsNear] = useState(false);
    // One push per slot: AdSense fills the <ins> once
    const pushed = useRef(false);
    const consent = useConsent();
    const dataSaver = useDataSaver();
    const height = ADSENSE_HEIGHT[placement];

    useEffect(() => {
        const element = box.current;
        if (!element || isNear) return;
        const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setIsNear(true), { rootMargin: '600px' });
        observer.observe(element);
        return () => observer.disconnect();
    }, [isNear]);

    const canLoad = isNear && consent !== null && !dataSaver;

    useEffect(() => {
        if (!canLoad || pushed.current) return;
        pushed.current = true;
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.requestNonPersonalizedAds = consent?.ads ? 0 : 1;
        addScript(unit.client);
        try {
            window.adsbygoogle.push({});
        } catch {
            // AdSense throws if the slot was already filled; nothing to do
        }
    }, [canLoad, consent, unit.client]);

    return (
        <div
            ref={box}
            role="complementary"
            aria-label="Advertisement"
            style={{ height }}
            className={twMerge('flex flex-col gap-2.5 overflow-hidden px-4 py-[18px] sm:px-0', className)}
        >
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-subtle">Advertisement</span>
            {canLoad && (
                <ins
                    className="adsbygoogle min-h-0 flex-1"
                    style={{ display: 'block', textAlign: unit.format === 'in-article' ? 'center' : undefined }}
                    data-ad-client={unit.client}
                    data-ad-slot={unit.slot_id}
                    data-ad-format="fluid"
                    {...(unit.format === 'in-article' ? { 'data-ad-layout': 'in-article' } : {})}
                    {...(unit.layout_key ? { 'data-ad-layout-key': unit.layout_key } : {})}
                />
            )}
        </div>
    );
}

export default AdSenseSlot;
