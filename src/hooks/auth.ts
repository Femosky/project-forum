'use client';

import AuthStateContext from '@/contexts/AuthState';
import ErrorUtility from '@/lib/utils/ErrorUtility';
import { useContext } from 'react';

export default function useAuth() {
    const context = useContext(AuthStateContext);
    if (ErrorUtility.isNullOrUndefined(context)) {
        throw new Error('useAuth must be used within an AuthStateProvider');
    }
    return context;
}
