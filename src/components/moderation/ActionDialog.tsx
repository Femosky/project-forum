'use client';

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { errorMessage } from '@/lib/api/errors';
import { DURATIONS } from '@/lib/moderation';

export type ActionInput = { reason?: string; days?: number };

type ActionDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmLabel: string;
    // Offer a duration; `allowPermanent: false` drops the permanent option (mutes always end)
    withDuration?: boolean;
    allowPermanent?: boolean;
    destructive?: boolean;
    onConfirm: (input: ActionInput) => Promise<void>;
};

// Asks for a reason (and a duration where it applies) before a moderation action. The reason goes in the mod log.
export function ActionDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    withDuration = false,
    allowPermanent = true,
    destructive = true,
    onConfirm,
}: ActionDialogProps) {
    const durations = allowPermanent ? DURATIONS : DURATIONS.filter((option) => option.days !== null);
    const [reason, setReason] = useState('');
    const [days, setDays] = useState<number | null>(durations[0].days);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) {
            setReason('');
            setDays(durations[0].days);
            setError(null);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsBusy(true);
        setError(null);
        try {
            await onConfirm({ reason: reason.trim() || undefined, ...(withDuration && days !== null ? { days } : {}) });
            handleOpenChange(false);
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent title={title} description={description}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {withDuration && (
                        <fieldset className="flex flex-wrap gap-2">
                            <legend className="mb-2 text-sm font-semibold">How long</legend>
                            {durations.map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    aria-pressed={days === option.days}
                                    onClick={() => setDays(option.days)}
                                    className={twMerge(
                                        'h-8 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors',
                                        days === option.days ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong hover:bg-surface-muted'
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </fieldset>
                    )}
                    <TextArea
                        name="reason"
                        aria-label="Reason (kept in the mod log)"
                        placeholder="Reason (kept in the mod log)"
                        maxLength={500}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant={destructive ? 'danger' : 'primary'} disabled={isBusy}>
                            {isBusy ? 'Working...' : confirmLabel}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ActionDialog;
