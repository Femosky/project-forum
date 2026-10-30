import { ApiErrorBody } from '@/types/api';

export class ApiError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public fields?: Record<string, string>,
        public details?: Record<string, unknown>
    ) {
        super(message);
    }
}

export function toApiError(status: number, data: unknown): ApiError {
    const error = (data as ApiErrorBody | null)?.error;
    if (status === 401) return new ApiError(status, error?.code ?? 'unauthorized', error?.message ?? 'Sign in to continue.');
    if (status === 429) return new ApiError(status, 'rate_limited', error?.message ?? 'Slow down a little and try again.');
    return new ApiError(status, error?.code ?? 'unknown', error?.message ?? 'Something went wrong. Try again.', error?.fields, error?.details);
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
