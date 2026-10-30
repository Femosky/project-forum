'use client';

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, LoaderCircle, Search } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Avatar from '@/components/ui/Avatar';
import { fieldStyles } from '@/components/ui/Input';
import { api } from '@/lib/api/client';
import { communityLabel, humanizeHandle } from '@/lib/communityName';

export type CommunityOption = { name: string; label: string | null; joined: boolean; image?: string | null };

type AutocompleteResponse = { communities: { name: string; display_name: string | null; image_url: string | null }[] };

// Wait for typing to pause before asking the API
const SEARCH_DELAY_MS = 180;
// With nothing typed: the communities you joined, then this many popular ones
const POPULAR_SHOWN = 12;

const nameOf = (option: CommunityOption) => communityLabel({ name: option.name, display_name: option.label });

function matches(option: CommunityOption, query: string): boolean {
    const q = query.toLowerCase();
    return nameOf(option).toLowerCase().includes(q) || option.name.includes(q.replace(/[\s_-]+/g, ''));
}

type PickerProps = {
    value: string;
    onChange: (name: string) => void;
    joined: CommunityOption[];
    popular: CommunityOption[];
    invalid?: boolean;
};

// Picks the community for a new post. There can be any number of communities, so instead of listing them all it
// shows yours and a few popular ones, and searches the API as you type (by name, so "tech car" finds Tech Careers).
export function CommunityPicker({ value, onChange, joined, popular, invalid = false }: PickerProps) {
    const id = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    // The last answer from the API, with the text it answers (an older answer is ignored while typing on)
    const [answer, setAnswer] = useState<{ query: string; options: CommunityOption[] } | null>(null);
    const [active, setActive] = useState(0);
    // The picked community as last seen in a list, so its name and picture show after the list changes
    const [picked, setPicked] = useState<CommunityOption | null>(null);
    const root = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);

    const joinedNames = useMemo(() => new Set(joined.map((c) => c.name)), [joined]);
    const trimmed = query.trim();

    // Search as you type; the communities you joined are matched here straight away
    useEffect(() => {
        if (!trimmed) return;
        let isCurrent = true;
        const timer = setTimeout(async () => {
            let options: CommunityOption[] = [];
            try {
                const data = await api<AutocompleteResponse>(`/search/autocomplete?q=${encodeURIComponent(trimmed.slice(0, 50))}`);
                options = data.communities.map((c) => ({ name: c.name, label: c.display_name, image: c.image_url, joined: joinedNames.has(c.name) }));
            } catch {
                // Offline or the API is down: only your own communities match
            }
            if (isCurrent) {
                setAnswer({ query: trimmed, options });
                setActive(0);
            }
        }, SEARCH_DELAY_MS);
        return () => {
            isCurrent = false;
            clearTimeout(timer);
        };
    }, [trimmed, joinedNames]);
    const results = answer?.query === trimmed ? answer.options : null;
    const isSearching = Boolean(trimmed) && !results;

    // What the list shows, in groups, with one flat order for the arrow keys
    const groups = useMemo(() => {
        if (!trimmed) {
            const others = popular.filter((c) => !joinedNames.has(c.name)).slice(0, POPULAR_SHOWN);
            return [
                { label: 'Your communities', options: joined },
                { label: 'Popular', options: others },
            ].filter((group) => group.options.length > 0);
        }
        const mine = joined.filter((c) => matches(c, trimmed));
        const mineNames = new Set(mine.map((c) => c.name));
        const found = (results ?? []).filter((c) => !mineNames.has(c.name));
        return [
            { label: 'Your communities', options: mine },
            { label: 'All communities', options: found },
        ].filter((group) => group.options.length > 0);
    }, [trimmed, results, joined, popular, joinedNames]);
    const flat = groups.flatMap((group) => group.options);

    // Close on a click anywhere else
    useEffect(() => {
        if (!isOpen) return;
        function onPointerDown(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [isOpen]);

    // The search box takes the keyboard as soon as the list opens
    useEffect(() => {
        if (isOpen) input.current?.focus();
    }, [isOpen]);

    // Keep the highlighted row in view while moving with the keyboard
    useEffect(() => {
        if (isOpen) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
    }, [active, isOpen, id]);

    function open() {
        setQuery('');
        setActive(0);
        setIsOpen(true);
    }

    function close() {
        setIsOpen(false);
        trigger.current?.focus();
    }

    function choose(option: CommunityOption) {
        setPicked(option);
        onChange(option.name);
        close();
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, flat.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (flat[active]) choose(flat[active]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'Tab') {
            setIsOpen(false);
        }
    }

    const selected =
        (picked?.name === value ? picked : null) ??
        joined.find((c) => c.name === value) ??
        popular.find((c) => c.name === value) ??
        (value ? { name: value, label: humanizeHandle(value), joined: false } : null);

    let index = -1;

    return (
        <div ref={root} className="relative">
            <button
                ref={trigger}
                type="button"
                id="community"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => (isOpen ? setIsOpen(false) : open())}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && !isOpen) {
                        event.preventDefault();
                        open();
                    }
                }}
                className={twMerge(
                    fieldStyles({ outline: invalid ? 'error' : 'default' }),
                    'flex cursor-pointer items-center gap-2.5 pr-2.5 text-left',
                    isOpen && 'border-muted ring-4 ring-active'
                )}
            >
                {selected ? (
                    <>
                        <Avatar name={selected.name} src={selected.image} shape="square" className="size-5 text-[10px]" />
                        <span className="min-w-0 flex-1 truncate font-medium">{nameOf(selected)}</span>
                    </>
                ) : (
                    <span className="flex-1 text-subtle">Choose a community</span>
                )}
                <ChevronDown className={twMerge('size-4 shrink-0 text-subtle transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
                <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-[10px] bg-surface-raised text-[14px] shadow-raised">
                    <div className="flex h-11 items-center gap-2.5 border-b border-border px-3">
                        <Search className="size-4 shrink-0 text-subtle" />
                        <input
                            ref={input}
                            role="combobox"
                            aria-expanded
                            aria-controls={`${id}-list`}
                            aria-activedescendant={flat[active] ? `${id}-${active}` : undefined}
                            aria-autocomplete="list"
                            aria-label="Search communities"
                            autoComplete="off"
                            spellCheck={false}
                            maxLength={50}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActive(0);
                            }}
                            onKeyDown={onKeyDown}
                            placeholder="Search communities"
                            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-subtle focus-visible:outline-none"
                        />
                        {isSearching && <LoaderCircle className="size-4 shrink-0 animate-spin text-subtle" aria-label="Searching" />}
                    </div>
                    <div id={`${id}-list`} role="listbox" aria-label="Communities" className="max-h-72 overflow-y-auto overscroll-contain p-1">
                        {groups.map((group) => (
                            <div key={group.label} role="group" aria-labelledby={`${id}-${group.label}`}>
                                <div id={`${id}-${group.label}`} className="px-2.5 pb-1 pt-2 text-xs font-semibold text-subtle">
                                    {group.label}
                                </div>
                                {group.options.map((option) => {
                                    index += 1;
                                    const optionIndex = index;
                                    const isActive = optionIndex === active;
                                    const isSelected = option.name === value;
                                    return (
                                        <div
                                            key={option.name}
                                            id={`${id}-${optionIndex}`}
                                            role="option"
                                            aria-selected={isSelected}
                                            onPointerMove={() => setActive(optionIndex)}
                                            onClick={() => choose(option)}
                                            className={twMerge(
                                                'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 font-medium text-muted',
                                                isActive && 'bg-active text-text'
                                            )}
                                        >
                                            <Avatar name={option.name} src={option.image} shape="square" className="size-5 text-[10px]" />
                                            <span className="min-w-0 flex-1 truncate">{nameOf(option)}</span>
                                            {isSelected && <Check className="size-4 shrink-0 text-text" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {flat.length === 0 && (
                            <p className="px-2.5 py-6 text-center text-sm text-subtle">
                                {trimmed ? (isSearching ? 'Searching…' : `No communities match “${trimmed}”`) : 'No communities yet'}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CommunityPicker;
