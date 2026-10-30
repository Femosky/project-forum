import { api } from '@/lib/api/client';

// Web push, loaded only when it's needed: after someone's first reply, or from Settings. The prompt is plain DOM so it
// adds no React to the page, and the browser's own permission question only appears after a yes here.

const ASKED_KEY = 'push_asked';

const urlKey = (key: string) => {
    const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(key.length / 4) * 4, '='));
    return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

export async function enablePush() {
    const { key } = await api<{ key: string | null }>('/notifications/push-key');
    if (!key) throw new Error("Notifications aren't available yet.");
    if ((await Notification.requestPermission()) !== 'granted') throw new Error('Allow notifications for this site in your browser settings.');
    const registration = await navigator.serviceWorker.register('/sw.js');
    const ready = await navigator.serviceWorker.ready;
    const subscription = await (ready ?? registration).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlKey(key) });
    await api('/notifications/push', { method: 'POST', body: subscription.toJSON() });
}

export async function disablePush() {
    const subscription = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
    if (!subscription) return;
    await api('/notifications/push', { method: 'DELETE', body: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
}

export async function isPushOn() {
    return Boolean(await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription());
}

export async function maybeAskForPush() {
    try {
        if (localStorage.getItem(ASKED_KEY)) return;
        const { key } = await api<{ key: string | null }>('/notifications/push-key');
        if (!key) return;
        localStorage.setItem(ASKED_KEY, '1');
    } catch {
        return;
    }

    const box = document.createElement('div');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Reply notifications');
    box.className = 'fixed inset-x-4 bottom-20 z-50 flex flex-col gap-2 rounded-xl bg-surface-raised p-4 text-sm text-text shadow-raised sm:left-auto sm:right-4 sm:w-80';
    const text = document.createElement('p');
    text.textContent = 'Want a notification when someone replies?';
    const row = document.createElement('div');
    row.className = 'flex justify-end gap-2';
    const button = (label: string, className: string, onClick: () => void) => {
        const element = document.createElement('button');
        element.type = 'button';
        element.textContent = label;
        element.className = `h-8 cursor-pointer rounded-[7px] px-3 font-semibold ${className}`;
        element.onclick = onClick;
        return element;
    };
    row.append(
        button('Not now', 'text-muted', () => box.remove()),
        button('Turn on', 'bg-accent text-accent-fg', () => {
            box.remove();
            void enablePush().catch(() => undefined);
        })
    );
    box.append(text, row);
    document.body.append(box);
}
