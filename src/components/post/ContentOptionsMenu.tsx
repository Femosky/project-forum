'use client';

import { lazy, Suspense, useState } from 'react';
import { BarChart3, Bookmark, BookmarkCheck, CircleCheck, Ellipsis, Eye, EyeOff, Flag, Lock, LockOpen, Pencil, Pin, PinOff, Radio, ShieldX, Trash2 } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/Dropdown';
import { ContentStatus } from '@/types/api';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import ReportDialog from './ReportDialog';

// Loaded on first open, so authors' insights add nothing to every page's JavaScript
const PostInsightsDialog = lazy(() => import('./PostInsightsDialog'));
import { useSaved } from './SaveButton';

type ContentOptionsMenuProps = {
    targetType: 'post' | 'comment';
    id: string;
    // The community it's in, so a report can name one of its rules
    community?: string;
    saved?: boolean;
    isAuthor?: boolean;
    // Called after the viewer deletes their own post or comment
    onDeleted?: () => void;
    // Offered to the author when the content can be edited where it's shown
    onEdit?: () => void;
    // Moderator tools, shown only to moderators of the community
    moderation?: Moderation;
    // Posts: start or end a live thread (moderators and trusted authors)
    live?: { isLive: boolean; onChanged: () => void };
    label?: string;
};

type Moderation = {
    status: ContentStatus;
    pinned: boolean;
    canPin: boolean;
    // Posts only: whether it's marked mature, so moderators can mark or unmark it
    mature?: boolean;
    // Gets the API's response body after an action succeeds
    onModerated: (body: unknown) => void;
};

type ModAction = 'remove' | 'approve' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'mark_mature' | 'unmark_mature';

function moderationItems({ status, pinned, canPin, mature }: Moderation): { action: ModAction; label: string; icon: typeof Pin; destructive?: boolean }[] {
    const isVisible = status === 'active' || status === 'locked';
    return [
        ...(canPin && isVisible ? [pinned ? { action: 'unpin' as const, label: 'Unpin', icon: PinOff } : { action: 'pin' as const, label: 'Pin', icon: Pin }] : []),
        ...(status === 'active' ? [{ action: 'lock' as const, label: 'Lock replies', icon: Lock }] : []),
        ...(status === 'locked' ? [{ action: 'unlock' as const, label: 'Unlock replies', icon: LockOpen }] : []),
        ...(mature === undefined ? [] : [mature ? { action: 'unmark_mature' as const, label: 'Unmark mature', icon: Eye } : { action: 'mark_mature' as const, label: 'Mark mature', icon: EyeOff }]),
        ...(isVisible ? [{ action: 'remove' as const, label: 'Remove', icon: ShieldX, destructive: true }] : []),
        ...(status === 'removed' || status === 'pending' ? [{ action: 'approve' as const, label: 'Approve', icon: CircleCheck }] : []),
    ];
}

// "..." menu on posts and comments: save, report, and delete for the author
export function ContentOptionsMenu({
    targetType,
    id,
    community,
    saved = false,
    isAuthor = false,
    onDeleted,
    onEdit,
    moderation,
    live,
    label,
}: ContentOptionsMenuProps) {
    const path = `/${targetType}s/${id}`;
    const { isSaved, toggleSave } = useSaved(path, saved);
    const [isReporting, setIsReporting] = useState(false);
    // null until first opened, so the dialog's code isn't fetched before then
    const [insightsOpen, setInsightsOpen] = useState<boolean | null>(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const requireAuth = useRequireAuth();

    function openReport() {
        if (!requireAuth('report')) return;
        setIsReporting(true);
    }

    const [modError, setModError] = useState<string | null>(null);

    async function moderate(action: ModAction) {
        setModError(null);
        try {
            const body = await api(`${path}/moderation`, { method: 'POST', body: { action } });
            moderation?.onModerated(body);
        } catch (error) {
            setModError(errorMessage(error));
        }
    }

    async function toggleLive() {
        if (!live) return;
        setModError(null);
        try {
            await api(`${path}/live`, { method: 'PUT', body: { live: !live.isLive } });
            live.onChanged();
        } catch (error) {
            setModError(errorMessage(error));
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await api(path, { method: 'DELETE' });
            setIsConfirmingDelete(false);
            onDeleted?.();
        } catch (error) {
            setDeleteError(errorMessage(error));
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <Dropdown>
                <DropdownTrigger asChild>
                    <IconButton aria-label={label ?? `${targetType === 'post' ? 'Post' : 'Comment'} options`} size="sm" className="relative z-10">
                        <Ellipsis />
                    </IconButton>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem onSelect={toggleSave}>
                        {isSaved ? <BookmarkCheck /> : <Bookmark />} {isSaved ? 'Unsave' : 'Save'}
                    </DropdownItem>
                    {!isAuthor && (
                        <DropdownItem destructive onSelect={openReport}>
                            <Flag /> Report
                        </DropdownItem>
                    )}
                    {live && (
                        <DropdownItem onSelect={toggleLive}>
                            <Radio /> {live.isLive ? 'End live thread' : 'Start live thread'}
                        </DropdownItem>
                    )}
                    {isAuthor && (
                        <>
                            {targetType === 'post' && (
                                <DropdownItem onSelect={() => setInsightsOpen(true)}>
                                    <BarChart3 /> Insights
                                </DropdownItem>
                            )}
                            {onEdit && (
                                <DropdownItem onSelect={onEdit}>
                                    <Pencil /> Edit
                                </DropdownItem>
                            )}
                            <DropdownSeparator />
                            <DropdownItem destructive onSelect={() => setIsConfirmingDelete(true)}>
                                <Trash2 /> Delete
                            </DropdownItem>
                        </>
                    )}
                    {moderation && moderationItems(moderation).length > 0 && (
                        <>
                            <DropdownSeparator />
                            <DropdownLabel>Moderation</DropdownLabel>
                            {moderationItems(moderation).map((item) => (
                                <DropdownItem key={item.action} destructive={item.destructive} onSelect={() => moderate(item.action)}>
                                    <item.icon /> {item.label}
                                </DropdownItem>
                            ))}
                        </>
                    )}
                </DropdownContent>
            </Dropdown>

            {modError && (
                <Dialog open onOpenChange={() => setModError(null)}>
                    <DialogContent title="That didn't work" description={modError}>
                        <Button className="w-full" onClick={() => setModError(null)}>
                            OK
                        </Button>
                    </DialogContent>
                </Dialog>
            )}

            {insightsOpen !== null && (
                <Suspense fallback={null}>
                    <PostInsightsDialog postId={id} open={insightsOpen} onOpenChange={setInsightsOpen} />
                </Suspense>
            )}

            <ReportDialog targetType={targetType} targetId={id} community={community} open={isReporting} onOpenChange={setIsReporting} />

            <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
                <DialogContent
                    title={`Delete this ${targetType}?`}
                    description={
                        targetType === 'post'
                            ? "It will be removed for everyone. This can't be undone."
                            : "Replies stay, but your words will show as [deleted]. This can't be undone."
                    }
                >
                    <div className="flex flex-col gap-3">
                        {deleteError && <ErrorMessage size="small" errorMessage={deleteError} role="alert" />}
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ContentOptionsMenu;
