'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Ellipsis, Flag, Trash2 } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from '@/components/ui/Dropdown';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import ReportDialog from './ReportDialog';

type ContentOptionsMenuProps = {
    targetType: 'post' | 'comment';
    id: string;
    saved?: boolean;
    isAuthor?: boolean;
    // Called after the viewer deletes their own post or comment
    onDeleted?: () => void;
    label?: string;
};

// "..." menu on posts and comments: save, report, and delete for the author
export function ContentOptionsMenu({ targetType, id, saved = false, isAuthor = false, onDeleted, label }: ContentOptionsMenuProps) {
    const [isSaved, setIsSaved] = useState(saved);
    const [isReporting, setIsReporting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const requireAuth = useRequireAuth();
    const path = `/${targetType}s/${id}`;

    async function toggleSave() {
        if (!requireAuth('save')) return;
        const next = !isSaved;
        setIsSaved(next);
        try {
            await api(`${path}/save`, { method: next ? 'PUT' : 'DELETE' });
        } catch {
            setIsSaved(!next);
        }
    }

    function openReport() {
        if (!requireAuth('report')) return;
        setIsReporting(true);
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
                    {isAuthor && (
                        <>
                            <DropdownSeparator />
                            <DropdownItem destructive onSelect={() => setIsConfirmingDelete(true)}>
                                <Trash2 /> Delete
                            </DropdownItem>
                        </>
                    )}
                </DropdownContent>
            </Dropdown>

            <ReportDialog targetType={targetType} targetId={id} open={isReporting} onOpenChange={setIsReporting} />

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
