import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';

export function LogoSection() {
    return (
        <section className="flex items-center gap-2 shrink-0">
            <Image src="/logo.jpg" alt="Logo" width={48} height={48} className="rounded-full" />
            <h1>{APP_NAME}</h1>
        </section>
    );
}

export default LogoSection;
