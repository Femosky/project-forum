'use client';

import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/lib/constants';

export function SearchSection() {
    return (
        <section className="w-full flex items-center gap-4">
            <form className="hidden md:flex w-full items-center gap-2">
                <input
                    type="text"
                    placeholder={`Search ${APP_NAME}`}
                    className="flex-1 px-4 py-2 rounded-4xl border border-gray-200"
                />
                <Button>Search</Button>
            </form>

            <Button size="round" className="block md:hidden">
                Search
            </Button>
        </section>
    );
}
