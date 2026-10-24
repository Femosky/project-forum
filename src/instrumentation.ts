import type { Instrumentation } from 'next';

// Errors thrown while rendering pages or running route handlers on the server
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    const { reportError } = await import('./lib/errorReport');
    const digest = (error as { digest?: string }).digest;
    // The route pattern, not the URL, so ids and query strings stay out of reports
    reportError(error, { runtime: 'server', path: `${request.method} ${context.routePath}`, digest });
};
