'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import ReportDialog from './ReportDialog';

// On profiles: report the account itself (spam account, impersonation) to the site team
export function ReportUserButton({ userId, username }: { userId: string; username: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const requireAuth = useRequireAuth();
    return (
        <>
            <IconButton aria-label={`Report u/${username}`} size="sm" onClick={() => requireAuth('report') && setIsOpen(true)}>
                <Flag />
            </IconButton>
            <ReportDialog targetType="user" targetId={userId} open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}

export default ReportUserButton;
