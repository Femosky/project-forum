'use client';
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
                <Button variant="ghost" size="sm" className="group text-muted hover:text-text" disabled={disabled}>
                    Sort by: <span className="text-text">{TextUtility.capitalize(sort)}</span>
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownTrigger>
            <DropdownContent align="start">
                <DropdownLabel>Sort comments by</DropdownLabel>
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
