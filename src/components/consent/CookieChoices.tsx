'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { readConsent } from '@/lib/consent';

type Choice = { id: 'necessary' | 'analytics' | 'ads'; title: string; description: string };

const CHOICES: Choice[] = [
    { id: 'necessary', title: 'Strictly necessary', description: 'Signing in, security checks (Turnstile) and the settings you pick. Always on.' },
    { id: 'analytics', title: 'Analytics', description: 'Counts page visits without cookies or anything stored on your device.' },
    { id: 'ads', title: 'Advertising', description: "Lets Google personalise ads and measure our own ad campaigns. Off: you still see ads, just general ones." },
];

// The "Choose" panel of the cookie banner. Loaded only when opened.
export default function CookieChoices({ onSave }: { onSave: (analytics: boolean, ads: boolean) => void }) {
    const saved = readConsent();
    const [state, setState] = useState({ analytics: saved?.analytics ?? true, ads: saved?.ads ?? false });

    return (
        <div className="flex flex-col gap-3">
            <p className="font-semibold">Cookie settings</p>
            <ul className="flex flex-col gap-2">
                {CHOICES.map((choice) => {
                    const on = choice.id === 'necessary' || state[choice.id];
                    return (
                        <li key={choice.id} className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="font-medium">{choice.title}</p>
                                <p className="text-muted">{choice.description}</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={on}
                                aria-label={choice.title}
                                disabled={choice.id === 'necessary'}
                                onClick={() => choice.id !== 'necessary' && setState({ ...state, [choice.id]: !state[choice.id] })}
                                className={`relative mt-1 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? 'bg-accent' : 'bg-border-strong'}`}
                            >
                                <span className={`absolute top-0.5 size-4 rounded-full bg-surface shadow transition-[left] ${on ? 'left-[18px]' : 'left-0.5'}`} />
                            </button>
                        </li>
                    );
                })}
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => onSave(false, false)}>
                    Reject all
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onSave(true, true)}>
                    Accept all
                </Button>
                <Button size="sm" onClick={() => onSave(state.analytics, state.ads)}>
                    Save choices
                </Button>
            </div>
        </div>
    );
}
