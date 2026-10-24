import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

// Server-rendered tab links (?tab=), so the tools work before scripts load
export function ToolTabs({ basePath, current, tabs }: { basePath: string; current: string; tabs: { id: string; label: string; count?: number | null }[] }) {
    return (
        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto px-4 sm:px-0">
            {tabs.map((tab) => (
                <Link
                    key={tab.id}
                    href={`${basePath}?tab=${tab.id}`}
                    aria-current={current === tab.id ? 'page' : undefined}
                    className={twMerge(
                        'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors',
                        current === tab.id ? 'bg-highlight text-highlight-fg' : 'text-muted hover:bg-surface-muted hover:text-text'
                    )}
                >
                    {tab.label}
                    {tab.count ? <span className="rounded-full bg-danger px-1.5 text-xs text-surface tabular-nums">{tab.count}</span> : null}
                </Link>
            ))}
        </nav>
    );
}

export default ToolTabs;
