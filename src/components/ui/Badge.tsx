import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

const badgeStyles = cva('inline-flex items-center gap-1 rounded-md px-1.5 py-px text-xs font-medium', {
    variants: {
        variant: {
            neutral: 'bg-active text-muted',
            highlight: 'bg-highlight text-highlight-fg',
            sponsored: 'text-muted ring-1 ring-inset ring-border-strong',
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
