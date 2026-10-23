'use client';

import { useSyncExternalStore } from 'react';

// Whether <html data-save-data> is set (see lib/dataSaver.ts). Follows the settings switch without a reload.
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-save-data'] });
    return () => observer.disconnect();
}

export function useDataSaver(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => document.documentElement.hasAttribute('data-save-data'),
        // Images only start loading on the client, so the server can assume "off"
        () => false
    );
}
