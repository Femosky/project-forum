'use client';

import NextTopLoader from 'nextjs-toploader';

export default function TopLoader() {
    return (
        <NextTopLoader
            color="green"
            height={2}
            showSpinner={false}
            crawl={true}
            speed={250}
            easing="ease-in-out"
            shadow={false}
            zIndex={9999}
        />
    );
}
