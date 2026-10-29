'use client';

import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import { API_BASE } from '@/lib/constants';
import { communityLabel } from '@/lib/communityName';
import { AutocompleteResponse } from '@/types/api';

// Wait for typing to pause before asking the API
const DELAY_MS = 150;

type Option = { href: string; label: string; detail: string; kind: 'community' | 'user'; image: string | null; name: string };

// Suggestions under the search box: communities and people whose names start like what's typed. Arrow keys move,
// Enter opens the highlighted one (or searches when none is), Escape closes. Loaded on demand by SearchBox.
// It follows the input itself (the box stays tiny): what's typed, focus and the keys.
export default function SearchSuggestions({ input }: { input: RefObject<HTMLInputElement | null> }) {
    const router = useRouter();
    const [query, setQuery] = useState(() => input.current?.value ?? '');
    const [open, setOpen] = useState(true);
    const onClose = useCallback(() => setOpen(false), []);
    const q = query.trim();

    // Typing reopens the list; leaving the box closes it (after a click on a suggestion has landed)
    useEffect(() => {
        const element = input.current;
        if (!element) return;
        const onInput = () => {
            setQuery(element.value);
            setOpen(true);
        };
        const onFocus = () => setOpen(true);
        const onBlur = () => setTimeout(() => setOpen(false), 150);
        element.addEventListener('input', onInput);
        element.addEventListener('focus', onFocus);
        element.addEventListener('blur', onBlur);
        return () => {
            element.removeEventListener('input', onInput);
            element.removeEventListener('focus', onFocus);
            element.removeEventListener('blur', onBlur);
        };
    }, [input]);

    useEffect(() => {
        input.current?.setAttribute('aria-expanded', String(open && Boolean(q)));
    }, [input, open, q]);
    const [answer, setAnswer] = useState<{ q: string; options: Option[] } | null>(null);
    const [active, setActive] = useState(-1);
    const options = useMemo(() => (answer?.q === q ? answer.options : []), [answer, q]);

    useEffect(() => {
        if (!q) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`${API_BASE}/search/autocomplete?q=${encodeURIComponent(q.slice(0, 50))}`, { signal: controller.signal });
                const data = (await response.json()) as AutocompleteResponse;
                setAnswer({
                    q,
                    options: [
                        ...data.communities.slice(0, 5).map((community) => ({
                            kind: 'community' as const,
                            href: `/c/${community.name}`,
                            name: community.name,
                            label: communityLabel(community),
                            detail: `${community.member_count} ${community.member_count === 1 ? 'member' : 'members'}`,
                            image: community.image_url,
                        })),
                        ...data.users.slice(0, 3).map((user) => ({
                            kind: 'user' as const,
                            href: `/u/${user.username}`,
                            name: user.username,
                            label: user.display_name || user.username,
                            detail: `@${user.username}`,
                            image: null,
                        })),
                    ],
                });
                setActive(-1);
            } catch {
                // Offline or aborted: the plain search still works
            }
        }, DELAY_MS);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [q]);

    useEffect(() => {
        const element = input.current;
        if (!element) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (!options.length) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                // -1 is "nothing highlighted": Enter then searches for the text
                const last = options.length - 1;
                setActive((index) => (event.key === 'ArrowDown' ? (index >= last ? -1 : index + 1) : index <= -1 ? last : index - 1));
            } else if (event.key === 'Enter' && active >= 0 && options[active]) {
                event.preventDefault();
                onClose();
                router.push(options[active].href);
            }
        };
        element.addEventListener('keydown', onKey);
        return () => element.removeEventListener('keydown', onKey);
    }, [input, options, active, onClose, router]);

    if (!open || !q || options.length === 0) return null;

    return (
        <ul
            id="search-suggestions"
            role="listbox"
            className="absolute inset-x-0 top-full z-50 mt-1 flex flex-col overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-raised"
        >
            {options.map((option, index) => (
                <li key={`${option.kind}:${option.name}`} role="option" aria-selected={index === active}>
                    <a
                        href={option.href}
                        onClick={(event) => {
                            event.preventDefault();
                            onClose();
                            router.push(option.href);
                        }}
                        onMouseEnter={() => setActive(index)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 text-sm ${index === active ? 'bg-hover' : ''}`}
                    >
                        <Avatar name={option.name} src={option.image} size="sm" shape={option.kind === 'community' ? 'square' : 'round'} />
                        <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                        <span className="shrink-0 text-xs text-subtle">{option.detail}</span>
                    </a>
                </li>
            ))}
        </ul>
    );
}
