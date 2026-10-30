'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { ReportReason } from '@/types/api';
import { REPORT_REASONS } from '@/lib/moderation';



type ReportDialogProps = {
    targetType: 'post' | 'comment' | 'user' | 'ad';
    targetId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ReportDialog({ targetType, targetId, open, onOpenChange }: ReportDialogProps) {
    const [reason, setReason] = useState<ReportReason | null>(null);
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) {
            setReason(null);
            setNote('');
            setStatus('idle');
            setError(null);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!reason) return;
        setStatus('sending');
        setError(null);
        try {
            await api('/reports', {
                method: 'POST',
                body: { target_type: targetType, target_id: targetId, reason_code: reason, note: note.trim() || undefined },
            });
            setStatus('sent');
        } catch (error) {
            setError(errorMessage(error));
            setStatus('idle');
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                title={status === 'sent' ? 'Thanks for reporting' : `Report this ${targetType}`}
                description={
                    status === 'sent'
                        ? targetType === 'user' || targetType === 'ad'
                            ? 'The site team will review it.'
                            : "The community's moderators will review it."
                        : "Reports are anonymous. Moderators see the reason, not who sent it."
                }
            >
                {status === 'sent' ? (
                    <Button className="w-full" onClick={() => handleOpenChange(false)}>
                        Done
                    </Button>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        <fieldset className="flex flex-wrap gap-2">
                            <legend className="sr-only">Reason</legend>
                            {REPORT_REASONS.map((option) => (
                                <label
                                    key={option.value}
                                    className="cursor-pointer rounded-full border border-border-strong px-3 py-1.5 text-sm font-semibold transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus/40"
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={option.value}
                                        checked={reason === option.value}
                                        onChange={() => setReason(option.value)}
                                        className="sr-only"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </fieldset>
                        <TextArea
                            name="note"
                            aria-label="Anything else moderators should know (optional)"
                            placeholder="Anything else moderators should know (optional)"
                            maxLength={1000}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                        <Button type="submit" disabled={!reason || status === 'sending'}>
                            {status === 'sending' ? 'Sending...' : 'Send report'}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ReportDialog;
