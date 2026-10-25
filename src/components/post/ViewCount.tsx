import { Eye } from 'lucide-react';
import NumberUtility from '@/lib/utils/NumberUtility';

// "1.2k views", shown only on your own posts and replies (the API sends the count to the author alone)
export function ViewCount({ views }: { views: number | undefined }) {
    if (views === undefined) return null;
    return (
        <span
            className="relative z-10 flex h-7 items-center gap-1.5 px-2 text-[13px] font-semibold text-subtle tabular-nums"
            title="Only you can see this"
        >
            <Eye className="size-4" />
            {NumberUtility.compactFormatter.format(views)}
            <span className="sr-only">{views === 1 ? 'view' : 'views'}</span>
        </span>
    );
}

export default ViewCount;
