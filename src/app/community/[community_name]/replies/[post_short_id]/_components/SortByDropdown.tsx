'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
    Dropdown,
    DropdownContent,
    DropdownLabel,
    DropdownRadioGroup,
    DropdownRadioItem,
    DropdownTrigger,
} from '@/components/ui/Dropdown';
import TextUtility from '@/lib/utils/TextUtility';

const SORT_OPTIONS = ['top', 'new', 'old'] as const;
export type CommentSort = (typeof SORT_OPTIONS)[number];

// Comment sorting isn't applied by the API yet; this only tracks the choice
export function SortByDropdown({
    initialSort = 'top',
    onChange,
}: {
    initialSort?: CommentSort;
    onChange?: (sort: CommentSort) => void;
}) {
    const [sort, setSort] = useState<CommentSort>(initialSort);

    function handleChange(value: string) {
        const next = value as CommentSort;
        setSort(next);
        onChange?.(next);
    }

    return (
        <Dropdown>
            <DropdownTrigger asChild>
                <Button variant="ghost" size="sm" className="group text-muted hover:text-text">
                    Sort by: <span className="text-text">{TextUtility.capitalize(sort)}</span>
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownTrigger>
            <DropdownContent align="start">
                <DropdownLabel>Sort comments by</DropdownLabel>
                <DropdownRadioGroup value={sort} onValueChange={handleChange}>
                    {SORT_OPTIONS.map((option) => (
                        <DropdownRadioItem key={option} value={option}>
                            {TextUtility.capitalize(option)}
                        </DropdownRadioItem>
                    ))}
                </DropdownRadioGroup>
            </DropdownContent>
        </Dropdown>
    );
}
