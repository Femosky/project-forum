'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import {
    Dropdown,
    DropdownContent,
    DropdownLabel,
    DropdownRadioGroup,
    DropdownRadioItem,
    DropdownTrigger,
} from '@/components/ui/Dropdown';
import { Theme, THEME_COOKIE_NAME, THEME_STORAGE_KEY, THEMES } from '@/lib/constants';
import { useAuthStateStore } from '@/lib/stateStore';

export type ThemeChoice = Theme | 'system';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Signed-in readers: the cookie lets the server render <html data-theme> on the next request, so there is no flash.
// Guests: the choice stays in this browser and THEME_SCRIPT applies it before paint, because a theme cookie would take
// them off the edge cache. A cookie, when there is one, wins, so an account's own choice takes over after sign-in.
export function applyTheme(choice: ThemeChoice) {
    const root = document.documentElement;
    const isGuest = !useAuthStateStore.getState().isAuthenticated;

    if (choice === 'system') delete root.dataset.theme;
    else root.dataset.theme = choice;

    if (choice === 'system' || isGuest) document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    else document.cookie = `${THEME_COOKIE_NAME}=${choice}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;

    try {
        if (choice !== 'system' && isGuest) localStorage.setItem(THEME_STORAGE_KEY, choice);
        else localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
        // Storage blocked: the choice lasts until the next page load
    }
}

// The current choice: what the server knew, or (cached guest pages) what this browser has stored
export function useThemeChoice(initialTheme: Theme | null) {
    const [choice, setChoice] = useState<ThemeChoice>(initialTheme ?? 'system');
    useEffect(() => {
        const applied = document.documentElement.dataset.theme;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- only known in the browser, after hydration
        if (applied === 'light' || applied === 'dark') setChoice(applied);
    }, []);
    return [choice, setChoice] as const;
}

export function ThemeMenu({ initialTheme, className }: { initialTheme: Theme | null; className?: string }) {
    const [choice, setChoice] = useThemeChoice(initialTheme);

    function handleChange(value: string) {
        const next = (THEMES as readonly string[]).includes(value) ? (value as Theme) : 'system';
        setChoice(next);
        applyTheme(next);
    }

    return (
        <Dropdown>
            <DropdownTrigger asChild>
                <IconButton aria-label="Change theme" className={className}>
                    {choice === 'dark' ? <Moon /> : choice === 'light' ? <Sun /> : <Monitor />}
                </IconButton>
            </DropdownTrigger>

            <DropdownContent>
                <DropdownLabel>Theme</DropdownLabel>
                <DropdownRadioGroup value={choice} onValueChange={handleChange}>
                    <DropdownRadioItem value="light">
                        <Sun /> Light
                    </DropdownRadioItem>
                    <DropdownRadioItem value="dark">
                        <Moon /> Dark
                    </DropdownRadioItem>
                    <DropdownRadioItem value="system">
                        <Monitor /> System
                    </DropdownRadioItem>
                </DropdownRadioGroup>
            </DropdownContent>
        </Dropdown>
    );
}

export default ThemeMenu;
