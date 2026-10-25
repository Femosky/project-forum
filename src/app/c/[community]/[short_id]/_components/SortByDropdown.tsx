'use client';
import { ChevronDown } from 'lucide-react';
import {
    Dropdown,
    DropdownContent,
    DropdownLabel,
    DropdownRadioGroup,
    DropdownRadioItem,
    DropdownTrigger,
} from '@/components/ui/Dropdown';
import TextUtility from '@/lib/utils/TextUtility';
import { CommentSort } from '@/types/api';

const SORT_OPTIONS: CommentSort[] = ['best', 'top', 'new', 'old'];

export function SortByDropdown({
    sort,
    onChange,
    disabled,
}: {
    sort: CommentSort;
    onChange: (sort: CommentSort) => void;
    disabled?: boolean;
}) {
    return (
        <Dropdown>
            <DropdownTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className="group flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-[13px] font-medium text-muted transition-colors hover:bg-hover disabled:opacity-50"
                >
                    Sort by <span className="font-semibold text-text">{TextUtility.capitalize(sort)}</span>
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </button>
            </DropdownTrigger>
            <DropdownContent align="end">
                <DropdownLabel>Sort replies by</DropdownLabel>
                <DropdownRadioGroup value={sort} onValueChange={(value) => onChange(value as CommentSort)}>
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
