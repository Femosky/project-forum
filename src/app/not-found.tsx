import Link from 'next/link';
import { Compass } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { APP_NAME } from '@/lib/constants';
import { noindexMetadata } from '@/lib/seo';

export const metadata = noindexMetadata(`Page not found | ${APP_NAME}`);

export default function NotFound() {
    return (
        <EmptyState
            icon={<Compass />}
            title="Page not found"
            description="The link may be broken, or the page may have been removed."
            action={
                <Button asChild>
                    <Link href="/">Go home</Link>
                </Button>
            }
            className="py-24"
        />
    );
}
