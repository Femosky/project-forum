import { Suspense } from 'react';
import AuthCard from '../_components/AuthCard';
import ConfirmLink from '../_components/ConfirmLink';

export default function VerifyEmailPage() {
    return (
        <AuthCard title="Confirm your email" subtitle="One tap and your account is fully set up.">
            <Suspense>
                <ConfirmLink endpoint="/auth/verify-email" action="Confirm my email" done="Your email is confirmed. Thanks!" />
            </Suspense>
        </AuthCard>
    );
}
