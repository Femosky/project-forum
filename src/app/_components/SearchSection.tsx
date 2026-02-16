'use client';

import { Button } from '@/components/ui/Button';
import InputField from '@/components/ui/Input';
import { APP_NAME } from '@/lib/constants';

export function SearchSection() {
    return (
        <section className="w-full flex items-center gap-4">
            <form className="hidden md:flex w-full items-center gap-2">
                <InputField variant="search" type="text" name="search" placeholder={`Search ${APP_NAME}`} />
                <Button>Search</Button>
            </form>

            <Button size="round" className="block md:hidden">
                Search
            </Button>
        </section>
    );
}
