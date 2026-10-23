import IconButton from '@/components/ui/IconButton';
import InputField from '@/components/ui/Input';
import { APP_NAME } from '@/lib/constants';
import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect, RedirectType } from 'next/navigation';

const handleSearch = async (formData: FormData) => {
    'use server';
    const search = formData.get('search') as string;
    if (!search) return;
    redirect(`/search?q=${encodeURIComponent(search)}`, RedirectType.push);
};

export function SearchSection() {
    return (
        <>
            <form action={handleSearch} role="search" className="relative hidden w-full max-w-xl md:block">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <InputField
                    variant="search"
                    type="search"
                    name="search"
                    aria-label={`Search ${APP_NAME}`}
                    placeholder={`Search ${APP_NAME}`}
                    className="pl-10"
                />
            </form>

            <IconButton asChild aria-label="Search" className="md:hidden">
                <Link href="/search">
                    <SearchIcon />
                </Link>
            </IconButton>
        </>
    );
}
