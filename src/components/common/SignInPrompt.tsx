'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { useUIStore } from '@/lib/uiStore';

const REASONS: Record<string, string> = {
    vote: 'Sign in to vote.',
    save: 'Sign in to save posts and comments.',
    reply: 'Sign in to join the conversation.',
    join: 'Sign in to join communities.',
    report: 'Sign in to report content.',
    post: 'Sign in to create a post.',
};

// Opened by useRequireAuth when a guest taps something that needs an account
export function SignInPrompt() {
    const reason = useUIStore((state) => state.signInReason);
    const close = useUIStore((state) => state.closeSignIn);
    const pathname = usePathname();
    const next = encodeURIComponent(pathname);

    return (
        <Dialog open={reason !== null} onOpenChange={(open) => !open && close()}>
            <DialogContent title="You're not signed in" description={(reason && REASONS[reason]) ?? 'Sign in to continue.'}>
                <div className="flex flex-col gap-2">
                    <Button asChild size="lg" onClick={close}>
                        <Link href={`/auth/login?next=${next}`}>Log in</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg" onClick={close}>
                        <Link href={`/auth/signup?next=${next}`}>Create an account</Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SignInPrompt;
