import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) return null;

    try {
        return jwt.verify(token.value, process.env.NEXT_PUBLIC_JWT_SECRET as string);
    } catch {
        return null;
    }
}
