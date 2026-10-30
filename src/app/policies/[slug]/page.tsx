import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { pageMetadata } from '@/lib/seo';
import { findPolicy, POLICIES } from '../policies';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
    return POLICIES.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const policy = findPolicy((await params).slug);
    if (!policy) return {};
    return pageMetadata({ title: `${policy.title} | ${APP_NAME}`, description: policy.summary, path: `/policies/${policy.slug}` });
}

export default async function PolicyPage({ params }: PageProps) {
    const policy = findPolicy((await params).slug);
    if (!policy) notFound();

    return (
        <article className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6">
            <header className="flex flex-col gap-1">
                <Link href="/policies" className="text-sm font-semibold text-link hover:underline">
                    Policies
                </Link>
                <h1 className="text-3xl font-extrabold">{policy.title}</h1>
                <p className="text-muted">{policy.summary}</p>
                <p className="text-xs text-muted">Last updated {policy.updated}</p>
            </header>
            {policy.sections.map((section) => (
                <section key={section.heading} id={section.id} className="flex scroll-mt-20 flex-col gap-2">
                    <h2 className="text-lg font-bold">{section.heading}</h2>
                    {section.paragraphs?.map((paragraph) => (
                        <p key={paragraph.slice(0, 40)} className="leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                    {section.items && (
                        <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed">
                            {section.items.map((item) => (
                                <li key={item.slice(0, 40)}>{item}</li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}
            <nav aria-label="Other policies" className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-sm">
                {POLICIES.filter((other) => other.slug !== policy.slug).map((other) => (
                    <Link key={other.slug} href={`/policies/${other.slug}`} className="font-semibold text-link hover:underline">
                        {other.title}
                    </Link>
                ))}
            </nav>
        </article>
    );
}
