import { ComponentProps, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type EmptyStateProps = Omit<ComponentProps<'div'>, 'title'> & {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
};

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
    return (
        <div
            {...props}
            className={twMerge('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}
        >
            {icon && (
                <div className="flex size-14 items-center justify-center rounded-full bg-highlight text-highlight-fg [&_svg]:size-7">
                    {icon}
                </div>
            )}
            <h2 className="text-lg font-bold">{title}</h2>
            {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

export default EmptyState;
