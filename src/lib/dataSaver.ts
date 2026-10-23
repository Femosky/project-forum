import { cookies, headers } from 'next/headers';
import { DATA_SAVER_COOKIE_NAME } from '@/lib/constants';

// Data saver hides link-preview images and profile pictures. It is on when the reader switched it on in settings,
// or when their browser sends "Save-Data: on" (Chrome's Lite mode, Opera's data saving) and they haven't switched
// it off. The layout marks <html data-save-data> so CSS and client components can follow it.
export async function getDataSaver(): Promise<{ enabled: boolean; choice: 'on' | 'off' | null }> {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    const value = cookieStore.get(DATA_SAVER_COOKIE_NAME)?.value;
    const choice = value === 'on' || value === 'off' ? value : null;
    const browserAsks = headerStore.get('save-data')?.toLowerCase() === 'on';
    return { enabled: choice === 'on' || (choice === null && browserAsks), choice };
}
