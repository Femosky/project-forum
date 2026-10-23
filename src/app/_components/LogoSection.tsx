import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';

export function LogoSection() {
    return (
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-full">
            <Image src="/logo.jpg" alt="" width={32} height={32} className="rounded-full" />
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">{APP_NAME}</span>
            <span className="sr-only sm:hidden">{APP_NAME}</span>
        </Link>
    );
}

export default LogoSection;
