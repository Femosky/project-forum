import Link from 'next/link';
import { Settings } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { serverApi } from '@/lib/api/server';
import { getTheme } from '@/components/theme/getTheme';
import { getDataSaver } from '@/lib/dataSaver';
import { SessionsResponse, UserResponse } from '@/types/api';
import EmptyState from '@/components/ui/EmptyState';
import AvatarSection from './_components/AvatarSection';
import Button from '@/components/ui/Button';
import {
    DataSaverToggle,
    DeleteAccount,
    EmailForm,
    ExportData,
    PasswordForm,
    ProfileForm,
    Section,
    SessionsList,
    ThemePicker,
} from './_components/SettingsForms';

export const metadata = { title: `Settings | ${APP_NAME}`, robots: { index: false } };

export default async function SettingsPage() {
    const [me, sessions, theme, dataSaver] = await Promise.all([
        serverApi<UserResponse>('/auth/me'),
        serverApi<SessionsResponse>('/auth/sessions'),
        getTheme(),
        getDataSaver(),
    ]);

    if (!me.data) {
        return (
            <EmptyState
                icon={<Settings />}
                title="Sign in to change your settings"
                action={
                    <Button asChild>
                        <Link href="/auth/login?next=/settings">Log in</Link>
                    </Button>
                }
            />
        );
    }

    const { user } = me.data;

    return (
        <div className="mx-auto flex w-full max-w-content flex-col gap-3 py-3 sm:px-4 sm:py-4">
            <h1 className="px-4 text-2xl font-extrabold sm:px-0">Settings</h1>

            {user.role === 'admin' && (
                <Section title="Site admin" description="Reports and held posts from every community, accounts, takedowns and the blocklist.">
                    <Button asChild variant="secondary" className="self-start">
                        <Link href="/admin">Open the admin panel</Link>
                    </Button>
                </Section>
            )}

            <Section title="Profile">
                <ProfileForm user={user} />
            </Section>

            <div id="avatar" className="scroll-mt-16">
                <Section title="Avatar" description="Drawn, never a photo: mix and match until it feels like you.">
                    <AvatarSection user={user} />
                </Section>
            </div>

            <Section title="Appearance" description="Follow your device, or pick one.">
                <ThemePicker initialTheme={theme} />
            </Section>

            <Section title="Data saver" description="Uses less data on slow or metered connections. Turns on by itself when your browser asks to save data.">
                <DataSaverToggle initialEnabled={dataSaver.enabled} />
            </Section>

            <Section title="Email">
                <EmailForm user={user} />
            </Section>

            <Section title="Password" description="Changing it signs out your other devices.">
                <PasswordForm user={user} />
            </Section>

            <Section title="Where you're signed in">
                <SessionsList initialSessions={sessions.data?.sessions ?? []} />
            </Section>

            <Section title="Your data" description="Everything you've posted, voted on and saved, as a JSON file.">
                <ExportData />
            </Section>

            <Section title="Delete account">
                <DeleteAccount user={user} />
            </Section>
        </div>
    );
}
