'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Ellipsis, Flag } from 'lucide-react';

export function PostOptions({ buttonZIndex }: { buttonZIndex: string }) {
    const [isOpen, setIsOpen] = useState(false);
    function handleClick() {
        setIsOpen(!isOpen);
    }
    return (
        <div className="relative">
            <Button onClick={handleClick} size="round" variant="transparent" className={buttonZIndex}>
                <Ellipsis className={`transition-transform duration-300 ease-in-out ${isOpen ? '-rotate-90' : ''}`} />
            </Button>

            {isOpen && (
                <>
                    <div onClick={handleClick} className="fixed inset-0 bg-transparent z-50" />
                    <div className="absolute top-10 right-4 w-32 bg-white z-60 rounded-sm transition-transform duration-1000 ease-in-out shadow-xl ring-1 ring-black/5">
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
