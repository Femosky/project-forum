'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { APP_NAME } from '@/lib/constants';
import { Community, ReportReason } from '@/types/api';
import { REPORT_REASONS } from '@/lib/moderation';

type ReportDialogProps = {
    targetType: 'post' | 'comment' | 'user' | 'ad';
    targetId: string;
    // Posts and comments: the community, whose own rules are offered alongside the site's
    community?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

// What the reporter picked: one of the community's rules (by its place in the list) or a site rule
type Choice = { kind: 'community'; index: number } | { kind: 'site'; reason: ReportReason };

const chipClass =
    'cursor-pointer rounded-full border border-border-strong px-3 py-1.5 text-sm font-semibold transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus/40';

// Reddit-style: a community rule goes to that community's moderators; a site rule goes to them and to the site's admins
export function ReportDialog({ targetType, targetId, community, open, onOpenChange }: ReportDialogProps) {
    const [choice, setChoice] = useState<Choice | null>(null);
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [rules, setRules] = useState<{ title: string; description?: string }[] | null>(null);
    const [communityLabel, setCommunityLabel] = useState(community);

    // The rules are fetched when the dialog first opens, so menus don't load them for every post and comment
    useEffect(() => {
        if (!open || !community || rules !== null) return;
        let cancelled = false;
        api<{ community: Community }>(`/communities/${encodeURIComponent(community)}`)
            .then(({ community: found }) => {
                if (cancelled) return;
                setRules(found.rules ?? []);
                setCommunityLabel(found.name_styled ?? found.name);
            })
            .catch(() => !cancelled && setRules([]));
        return () => {
            cancelled = true;
        };
    }, [open, community, rules]);

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) {
            setChoice(null);
            setNote('');
            setStatus('idle');
            setError(null);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!choice) return;
        setStatus('sending');
        setError(null);
        try {
            await api('/reports', {
                method: 'POST',
                body: {
                    target_type: targetType,
                    target_id: targetId,
                    ...(choice.kind === 'community' ? { community_rule: choice.index } : { reason_code: choice.reason }),
                    note: note.trim() || undefined,
                },
            });
            setStatus('sent');
        } catch (error) {
            setError(errorMessage(error));
            setStatus('idle');
        }
    }

    const siteLevel = targetType === 'user' || targetType === 'ad' || !community;
    const sentDescription = siteLevel
        ? `The ${APP_NAME} team will review it.`
        : choice?.kind === 'community'
          ? "The community's moderators will review it."
          : `The community's moderators and the ${APP_NAME} team will review it.`;
    const hasRules = Boolean(community && rules && rules.length > 0);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                title={status === 'sent' ? 'Thanks for reporting' : `Report this ${targetType}`}
                description={status === 'sent' ? sentDescription : 'Reports are anonymous. Moderators see the rule, not who sent it.'}
            >
                {status === 'sent' ? (
                    <Button className="w-full" onClick={() => handleOpenChange(false)}>
                        Done
                    </Button>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        {community && rules === null && <p className="text-sm text-muted">Loading the community&apos;s rules...</p>}
                        {hasRules && (
                            <fieldset className="flex flex-col gap-2">
                                <legend className="mb-2 text-sm font-bold">Breaks {communityLabel}&apos;s rules</legend>
                                <div className="flex flex-wrap gap-2">
                                    {rules!.map((rule, index) => (
                                        <label key={`${index}-${rule.title}`} className={chipClass} title={rule.description || undefined}>
                                            <input
                                                type="radio"
                                                name="rule"
                                                checked={choice?.kind === 'community' && choice.index === index}
                                                onChange={() => setChoice({ kind: 'community', index })}
                                                className="sr-only"
                                            />
                                            {rule.title}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                        <fieldset className="flex flex-col gap-2">
                            <legend className={hasRules ? 'mb-2 text-sm font-bold' : 'sr-only'}>Breaks {APP_NAME}&apos;s rules</legend>
                            <div className="flex flex-wrap gap-2">
                                {REPORT_REASONS.map((option) => (
                                    <label key={option.value} className={chipClass}>
                                        <input
                                            type="radio"
                                            name="rule"
                                            value={option.value}
                                            checked={choice?.kind === 'site' && choice.reason === option.value}
                                            onChange={() => setChoice({ kind: 'site', reason: option.value })}
                                            className="sr-only"
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {choice && !siteLevel && (
                            <p className="text-xs text-muted">
                                {choice.kind === 'community'
                                    ? "Goes to this community's moderators."
                                    : `Goes to this community's moderators and the ${APP_NAME} team.`}
                            </p>
                        )}
                        <TextArea
                            name="note"
                            aria-label="Anything else moderators should know (optional)"
                            placeholder="Anything else moderators should know (optional)"
                            maxLength={1000}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
                        <Button type="submit" disabled={!choice || status === 'sending'}>
                            {status === 'sending' ? 'Sending...' : 'Send report'}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ReportDialog;
