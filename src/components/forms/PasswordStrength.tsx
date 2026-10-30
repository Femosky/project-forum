import { twMerge } from 'tailwind-merge';
import { passwordScore } from './rules';

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const COLORS = ['bg-danger', 'bg-danger', 'bg-amber-500', 'bg-success', 'bg-success'] as const;

// Four bars and a word, always taking the same space. Only a guide: the rules and the breach check decide what's accepted.
export function PasswordStrength({ password }: { password: string }) {
    const score = passwordScore(password);
    return (
        <div className="flex items-center gap-2" aria-hidden="true">
            <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((bar) => (
                    <span key={bar} className={twMerge('h-1 flex-1 rounded-full bg-border', bar <= score && COLORS[score])} />
                ))}
            </div>
            <span className="w-14 text-right text-xs text-muted">{password ? LABELS[score] : ''}</span>
        </div>
    );
}
