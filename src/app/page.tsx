'use client';

import { useLogin } from '@/hooks/useLogin';
import { useState } from 'react';

export default function Home() {
    const { login, error: loginError } = useLogin();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (email.length > 0) {
            login(email, undefined, password);
        } else if (username.length > 0) {
            login(undefined, username, password);
        } else {
            setError('Email or username is required');
        }
    };

    return (
        <div>
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
                {error && <p className="text-red-500">{error}</p>}
                {loginError && <p className="text-red-500">{loginError}</p>}
            </form>
        </div>
    );
}
