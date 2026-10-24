'use client';

import { useState } from 'react';
import { Ellipsis, Flag, Info } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { NativeAdUnit } from './types';

import ReportDialog from '@/components/post/ReportDialog';
import WhyDialog from './AdWhyDialog';

// "..." on a sponsored card: why it's shown, and reporting it to the site team
export function AdMenu({ unit }: { unit: NativeAdUnit }) {
    const [dialog, setDialog] = useState<'why' | 'report' | null>(null);
    const requireAuth = useRequireAuth();
    const isHouse = unit.kind === 'house';

    return (
        <>
            <Dropdown>
                <DropdownTrigger asChild>
                    <IconButton aria-label="Ad options" size="sm" className="relative z-10 -my-1">
                        <Ellipsis />
                    </IconButton>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem onSelect={() => setDialog('why')}>
                        <Info /> Why am I seeing this?
                    </DropdownItem>
                    {!isHouse && (
                        <DropdownItem destructive onSelect={() => requireAuth('report') && setDialog('report')}>
                            <Flag /> Report ad
                        </DropdownItem>
                    )}
                </DropdownContent>
            </Dropdown>
            {dialog === 'why' && <WhyDialog unit={unit} onClose={() => setDialog(null)} />}
            {!isHouse && <ReportDialog targetType="ad" targetId={unit.id} open={dialog === 'report'} onOpenChange={(open) => setDialog(open ? 'report' : null)} />}
        </>
    );
}

export default AdMenu;
