'use client';

import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import { selectStyles } from '@/components/ui/Input';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

type Settings = { email_replies: boolean; email_mentions: boolean; digest: 'weekly' | 'daily' | 'off'; push_replies: boolean; push_trending: boolean };

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-accent" />
            {label}
        </label>
    );
}

// What people hear about by email and on this device. Push code loads only if the browser can do it.
export function NotificationSettings({ initial, initialHidden }: { initial: Settings; initialHidden: string[] }) {
    const [settings, setSettings] = useState(initial);
    const [hidden, setHidden] = useState(initialHidden);
    const [push, setPush] = useState<'unsupported' | 'off' | 'on'>('unsupported');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!('PushManager' in window)) return;
        void import('@/lib/pushPrompt').then(async ({ isPushOn }) => setPush((await isPushOn()) ? 'on' : 'off'));
    }, []);

    async function save(change: Partial<Settings> & { digest_hidden?: string[] }) {
        const previous = settings;
        setSettings({ ...settings, ...change });
        setError(null);
        try {
            await api('/notifications/settings', { method: 'PUT', body: change });
        } catch (error) {
            setSettings(previous);
            setError(errorMessage(error));
        }
    }

    async function togglePush() {
        setError(null);
        try {
            const { disablePush, enablePush } = await import('@/lib/pushPrompt');
            if (push === 'on') await disablePush();
            else await enablePush();
            setPush(push === 'on' ? 'off' : 'on');
        } catch (error) {
            setError(errorMessage(error));
        }
    }

    function unhide(name: string) {
        const next = hidden.filter((item) => item !== name);
        setHidden(next);
        void save({ digest_hidden: next });
    }

    return (
        <div className="flex flex-col gap-3">
            <Toggle label="Email me about replies" checked={settings.email_replies} onChange={(email_replies) => save({ email_replies })} />
            <Toggle label="Email me when someone mentions me" checked={settings.email_mentions} onChange={(email_mentions) => save({ email_mentions })} />
            <label className="flex items-center justify-between gap-3 text-sm">
                Digest of top posts from your communities
                <select className={twMerge(selectStyles, 'h-8 w-auto text-sm')} value={settings.digest} onChange={(e) => save({ digest: e.target.value as Settings['digest'] })}>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="off">Off</option>
                </select>
            </label>
            {hidden.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    Hidden from your digest:
                    {hidden.map((name) => (
                        <Button key={name} size="sm" variant="ghost" onClick={() => unhide(name)}>
                            c/{name} ×
                        </Button>
                    ))}
                </div>
            )}
            {push !== 'unsupported' && (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        Notifications on this device
                        <Button size="sm" variant="secondary" onClick={togglePush}>
                            {push === 'on' ? 'Turn off' : 'Turn on'}
                        </Button>
                    </div>
                    {push === 'on' && (
                        <>
                            <Toggle label="Replies and mentions" checked={settings.push_replies} onChange={(push_replies) => save({ push_replies })} />
                            <Toggle label="Trending in your communities (at most one a day)" checked={settings.push_trending} onChange={(push_trending) => save({ push_trending })} />
                        </>
                    )}
                </div>
            )}
            {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
        </div>
    );
}

export default NotificationSettings;
