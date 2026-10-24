import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { pageMetadata } from '@/lib/seo';
import { POLICIES } from './policies';

export const metadata = pageMetadata({
    title: `Policies | ${APP_NAME}`,
    description: `The rules for ${APP_NAME}: content policy, community and moderator guidelines, and legal requests.`,
    path: '/policies',
});

export default function PoliciesPage() {
    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-4 px-4 py-6">
            <h1 className="text-3xl font-extrabold">Policies</h1>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
                {POLICIES.map((policy) => (
                    <li key={policy.slug}>
                        <Link href={`/policies/${policy.slug}`} className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-surface-muted/60">
                            <span className="font-bold">{policy.title}</span>
                            <span className="text-sm text-muted">{policy.summary}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
