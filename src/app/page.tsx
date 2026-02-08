'use client';

import { useLogin } from '@/hooks/useLogin';
import { useState } from 'react';

export default function Home() {
    const { login, error, logout } = useLogin();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [clientError, setClientError] = useState('');

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setClientError('');
        if (email.length > 0) {
            login(email, undefined, password);
        } else if (username.length > 0) {
            login(undefined, username, password);
        } else {
            setClientError('Email or username is required');
        }
    };

    const handleLogout = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setClientError('');
        logout();
    };

    return (
        <div className="flex flex-col gap-10">
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
                {clientError && <p className="text-red-500">{clientError}</p>}
                {error && <p className="text-red-500">{error}</p>}
            </form>

            <form onSubmit={handleLogout}>
                <button type="submit">Logout</button>
            </form>
        </div>
    );
}
