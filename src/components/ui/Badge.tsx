import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

const badgeStyles = cva('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', {
    variants: {
        variant: {
            neutral: 'bg-surface-muted text-muted',
            highlight: 'bg-highlight text-highlight-fg',
            sponsored: 'border border-sponsored/40 text-sponsored',
            danger: 'bg-danger/10 text-danger',
        },
    },
    defaultVariants: { variant: 'neutral' },
});

type BadgeProps = VariantProps<typeof badgeStyles> & ComponentProps<'span'>;

export function Badge({ variant, className, ...props }: BadgeProps) {
    return <span {...props} className={twMerge(badgeStyles({ variant }), className)} />;
}

export default Badge;
