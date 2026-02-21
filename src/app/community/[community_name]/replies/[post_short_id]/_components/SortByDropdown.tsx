'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { ChevronDown, Flag } from 'lucide-react';
import TextUtility from '@/lib/utils/TextUtility';
import { twMerge } from 'tailwind-merge';

export function SortByDropdown({ buttonZIndex, filter }: { buttonZIndex: string; filter: string }) {
    const [isOpen, setIsOpen] = useState(false);
    function handleClick() {
        setIsOpen(!isOpen);
    }
    return (
        <div className="relative">
            <Button
                onClick={handleClick}
                className={twMerge(
                    buttonZIndex,
                    'flex items-center gap-1 px-2 py-1 text-sm',
                    isOpen && 'bg-secondary-hover'
                )}
                size="round"
                variant="transparent"
            >
                {TextUtility.capitalize(filter)}{' '}
                <span>
                    <ChevronDown
                        className={`transition-transform duration ease-in-out ${isOpen ? 'rotate-180' : ''}`}
                    />
                </span>
            </Button>

            {isOpen && (
                <>
                    <div onClick={handleClick} className="fixed inset-0 bg-transparent z-50" />
                    <div className="absolute top-10 -right-5 w-32 bg-white z-60 rounded-sm transition-transform duration-1000 ease-in-out shadow-xl ring-1 ring-black/5">
                        {/* Menu options */}
                        <ul className="flex flex-col text-sm">
                            <li className="flex items-center gap-1 px-2 hover:bg-translucent">
                                <Button variant="clear" size="round" className={buttonZIndex}>
                                    <Flag className="size-5" />
                                </Button>

                                <span>Report</span>
                            </li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
