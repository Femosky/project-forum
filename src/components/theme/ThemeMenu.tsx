'use client';

import { useState } from 'react';
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
import { Theme, THEME_COOKIE_NAME, THEMES } from '@/lib/constants';

export type ThemeChoice = Theme | 'system';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// The cookie lets the server render <html data-theme> on the next request, so there is no flash
export function applyTheme(choice: ThemeChoice) {
    const root = document.documentElement;

    if (choice === 'system') {
        delete root.dataset.theme;
        document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    } else {
        root.dataset.theme = choice;
        document.cookie = `${THEME_COOKIE_NAME}=${choice}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    }
}

export function ThemeMenu({ initialTheme }: { initialTheme: Theme | null }) {
    const [choice, setChoice] = useState<ThemeChoice>(initialTheme ?? 'system');

    function handleChange(value: string) {
        const next = (THEMES as readonly string[]).includes(value) ? (value as Theme) : 'system';
        setChoice(next);
        applyTheme(next);
    }

    return (
        <Dropdown>
            <DropdownTrigger asChild>
                <IconButton aria-label="Change theme">
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
