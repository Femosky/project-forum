'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { usernameError } from './rules';

type Check = { state: 'idle' | 'checking' | 'available' | 'taken'; message?: string };

// Asks the API whether a username is free once the typing pauses and the format is right
export function useUsernameCheck(username: string): Check {
    const value = username.trim().toLowerCase();
    const isCheckable = Boolean(value) && !usernameError(value);
    const [result, setResult] = useState<{ value: string; check: Check } | null>(null);

    useEffect(() => {
        if (!isCheckable) return;
        let stale = false;
        const timer = setTimeout(async () => {
            let check: Check = { state: 'idle' };
            try {
                const answer = await api<{ available: boolean; reason?: string }>(`/auth/username-available?username=${encodeURIComponent(value)}`);
                check = answer.available ? { state: 'available', message: `${value} is available` } : { state: 'taken', message: answer.reason };
            } catch {
                // Not knowing isn't an error; signing up still checks
            }
            if (!stale) setResult({ value, check });
        }, 400);
        return () => {
            stale = true;
            clearTimeout(timer);
        };
    }, [value, isCheckable]);

    if (!isCheckable) return { state: 'idle' };
    return result?.value === value ? result.check : { state: 'checking' };
}
