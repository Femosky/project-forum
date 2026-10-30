'use client';

import { useEffect, useState } from 'react';

type Props = { next: string; onLinkRequired: (email: string) => void };

// Loads the Google button's code only on the pages that show it, after they render, so it adds nothing to any page's
// first load. Keeps the button's space from the start, so nothing moves when it appears.
export function LazyGoogleSignIn(props: Props) {
    const [GoogleSignIn, setGoogleSignIn] = useState<React.ComponentType<Props> | null>(null);
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) void import('./GoogleSignIn').then((module) => setGoogleSignIn(() => module.GoogleSignIn));
    }, []);
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;
    return GoogleSignIn ? <GoogleSignIn {...props} /> : <div className="h-[4.75rem]" />;
}
