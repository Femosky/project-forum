'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { APP_NAME } from '@/lib/constants';
import type { NativeAdUnit } from './types';

export function AdWhyDialog({ unit, onClose }: { unit: NativeAdUnit; onClose: () => void }) {
    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent title="Why am I seeing this?">
                <div className="flex flex-col gap-4 text-sm text-muted">
                    <p>
                        {unit.kind === 'house'
                            ? `This is a message from ${APP_NAME}.`
                            : `${unit.creative.advertiser_name} paid to show this here. Sponsored posts are chosen by the community or topic you're reading, not by your personal details or browsing history.`}{' '}
                        <Link href="/policies/ads" className="font-semibold text-link hover:underline">
                            How ads work
                        </Link>
                    </p>
                    <Button onClick={onClose}>Got it</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default AdWhyDialog;
