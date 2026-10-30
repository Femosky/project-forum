'use client';

import { lazy, Suspense, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

// The suggestions list (with everything that follows the typing) downloads on first focus, so the box costs almost
// nothing up front
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

const INPUT = {
    sidebar: 'h-8 rounded-md bg-transparent pl-8 pr-2 hover:bg-hover focus:bg-hover',
    page: 'h-9 rounded-[7px] border border-transparent bg-hover pl-10 pr-3 focus:border-border-strong focus:bg-surface',
};

// The site's search box: a plain GET form to /search (works before scripts load), plus community and people
// suggestions as you type, from /search/autocomplete
export default function SearchBox({ defaultValue, placeholder = 'Search', autoFocus, hidden = {}, variant = 'sidebar' }: SearchBoxProps) {
    const [wanted, setWanted] = useState(false);
    const input = useRef<HTMLInputElement>(null);

    return (
        <form action="/search" role="search" className="relative">
            <Search className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-subtle ${variant === 'sidebar' ? 'left-2' : 'left-3.5'}`} />
            {Object.entries(hidden).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
            <input
                ref={input}
                type="search"
                name="q"
                defaultValue={defaultValue}
                autoFocus={autoFocus}
                autoComplete="off"
                role="combobox"
                aria-expanded={false}
                aria-controls="search-suggestions"
                aria-autocomplete="list"
                aria-label={`Search ${APP_NAME}`}
                placeholder={placeholder}
                onFocus={() => setWanted(true)}
                className={`w-full text-sm text-text placeholder:text-subtle outline-none transition-colors ${INPUT[variant]}`}
            />
            {wanted && (
                <Suspense fallback={null}>
                    <SearchSuggestions input={input} />
                </Suspense>
            )}
        </form>
    );
}
