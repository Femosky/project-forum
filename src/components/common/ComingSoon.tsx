import Link from 'next/link';
import { Hammer } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// Placeholder for routes the navigation already links to but that aren't built yet
export function ComingSoon({ title, description }: { title: string; description?: string }) {
    return (
        <EmptyState
            icon={<Hammer />}
            title={title}
            description={description ?? "This page isn't ready yet."}
            action={
                <Button asChild variant="secondary">
                    <Link href="/">Back to home</Link>
                </Button>
            }
        />
    );
}

export default ComingSoon;
