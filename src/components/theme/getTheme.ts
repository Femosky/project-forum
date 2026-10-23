import { cookies } from 'next/headers';
import { Theme, THEME_COOKIE_NAME, THEMES } from '@/lib/constants';

// The theme the user explicitly picked, or null to follow the system setting
export async function getTheme(): Promise<Theme | null> {
    const value = (await cookies()).get(THEME_COOKIE_NAME)?.value;
    return (THEMES as readonly string[]).includes(value ?? '') ? (value as Theme) : null;
}
