'use client';

import { useState } from 'react';

type Rules<K extends string> = Record<K, () => string | undefined>;

// Per-field errors for a form: a field is checked when it loses focus, rechecked as it's typed in once it has an
// error (so the message clears as soon as it's fixed), and every field is checked on submit. Server field errors
// can be merged in with setErrors.
export function useFieldErrors<K extends string>(rules: Rules<K>) {
    const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

    const check = (name: K) => setErrors((current) => ({ ...current, [name]: rules[name]() }));
    const recheck = (name: K) => {
        if (errors[name]) check(name);
    };
    function checkAll() {
        const next = {} as Partial<Record<K, string>>;
        for (const name of Object.keys(rules) as K[]) next[name] = rules[name]();
        setErrors(next);
        const first = (Object.keys(next) as K[]).find((name) => next[name]);
        if (first) document.getElementById(first)?.focus();
        return !first;
    }

    return { errors, setErrors, check, recheck, checkAll };
}
