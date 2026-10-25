import { ComponentProps, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type PageBarProps = Omit<ComponentProps<'div'>, 'title'> & {
    // What the page is: a word ("Home") or a small breadcrumb
    title: ReactNode;
    // Controls on the right, such as sort tabs or share and save
    actions?: ReactNode;
};

// The thin frosted bar at the top of a page's column. Sticks under the phone header, or to the top on desktop.
export function PageBar({ title, actions, className, ...props }: PageBarProps) {
    return (
        <div
            {...props}
            className={twMerge(
                'sticky top-header z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-bar px-4 backdrop-blur-xl backdrop-saturate-150 md:px-5',
                className
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold">{title}</div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
    );
}

export default PageBar;
