import { Suspense } from 'react';
import AuthCard from '../_components/AuthCard';
import ConfirmLink from '../_components/ConfirmLink';

export default function ConfirmEmailPage() {
    return (
        <AuthCard title="Confirm your new email" subtitle="Your account will use this address from now on.">
            <Suspense>
                <ConfirmLink endpoint="/auth/confirm-email" action="Use this email" done="Done. Your account now uses your new email address." />
            </Suspense>
        </AuthCard>
    );
}
