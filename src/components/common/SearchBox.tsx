'use client';

import { lazy, Suspense, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { APP_NAME } from '@/lib/constants';

// The suggestions list (and its API calls) downloads on first focus, so the box costs almost nothing up front
const SearchSuggestions = lazy(() => import('./SearchSuggestions'));

type SearchBoxProps = {
    defaultValue?: string;
    placeholder?: string;
    autoFocus?: boolean;
    // Extra fields carried with the search (type, community)
    hidden?: Record<string, string>;
    // 'sidebar': the quiet desktop sidebar field; 'page': the search page's own box
    variant?: 'sidebar' | 'page';
};

// The site's search box: a plain GET form to /search (works before scripts load), plus community and people
// suggestions as you type, from /search/autocomplete
export default function SearchBox({ defaultValue = '', placeholder = 'Search', autoFocus, hidden = {}, variant = 'sidebar' }: SearchBoxProps) {
    const [query, setQuery] = useState(defaultValue);
    const [wanted, setWanted] = useState(false);
    const [open, setOpen] = useState(false);
    const input = useRef<HTMLInputElement>(null);

    return (
        <form action="/search" role="search" className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
            <Search
                className={twMerge(
                    'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-subtle',
                    variant === 'sidebar' ? 'left-2' : 'left-3.5'
                )}
            />
            {Object.entries(hidden).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
            <input
                ref={input}
                type="search"
                name="q"
                value={query}
                autoFocus={autoFocus}
                autoComplete="off"
                role="combobox"
                aria-expanded={open && query.trim().length > 0}
                aria-controls="search-suggestions"
                aria-autocomplete="list"
                aria-label={`Search ${APP_NAME}`}
                placeholder={placeholder}
                onFocus={() => {
                    setWanted(true);
                    setOpen(true);
                }}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                className={twMerge(
                    'w-full text-sm text-text placeholder:text-subtle outline-none transition-colors',
                    variant === 'sidebar'
                        ? 'h-8 rounded-md bg-transparent pl-8 pr-2 hover:bg-hover focus:bg-hover'
                        : 'h-9 rounded-[7px] border border-transparent bg-hover pl-10 pr-3 focus:border-border-strong focus:bg-surface'
                )}
            />
            {wanted && open && (
                <Suspense fallback={null}>
                    <SearchSuggestions query={query} input={input} onClose={() => setOpen(false)} />
                </Suspense>
            )}
        </form>
    );
}
