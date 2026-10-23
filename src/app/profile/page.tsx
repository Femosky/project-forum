import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api/server';
import { UserResponse } from '@/types/api';

// "Profile" in the navigation: your own public profile, or sign in first
export default async function ProfilePage() {
    const { data } = await serverApi<UserResponse>('/auth/me');
    redirect(data ? `/u/${data.user.username}` : '/auth/login?next=/profile');
}
