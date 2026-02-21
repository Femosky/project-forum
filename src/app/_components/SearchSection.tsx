import { Button } from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import { APP_NAME } from '@/lib/constants';
import { SearchIcon } from 'lucide-react';
import { redirect, RedirectType } from 'next/navigation';

const handleSearch = async (formData: FormData) => {
    'use server';
    const search = formData.get('search') as string;
    if (!search) return;
    redirect(`/search?q=${encodeURIComponent(search)}`, RedirectType.push);
};

export function SearchSection() {
    return (
        <section className="w-full flex items-center gap-4">
            <form action={handleSearch} className="hidden md:flex w-full items-center gap-2">
                <InputField variant="search" type="text" name="search" placeholder={`Search ${APP_NAME}`} />
                <Button type="submit">Search</Button>
            </form>

            <Button size="round" variant="transparent" className="block md:hidden">
                <SearchIcon />
            </Button>
        </section>
    );
}
