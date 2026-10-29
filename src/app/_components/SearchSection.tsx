import IconButton from '@/components/ui/IconButton';
import { SearchIcon } from 'lucide-react';
import Link from 'next/link';

// The phone header's search: a link to /search, whose box suggests communities and people as you type. (On wider
// screens the sidebar has the search box and this header isn't shown.)
export function SearchSection() {
    return (
        <IconButton asChild aria-label="Search">
            <Link href="/search">
                <SearchIcon />
            </Link>
        </IconButton>
    );
}
