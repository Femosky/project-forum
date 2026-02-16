import { APIUtility } from '../utils/APIUtility';

class APIService {
    static async refreshAccessToken(): Promise<unknown | Error> {
        try {
            const response = await fetch(`${APIUtility.getApiUrl()}/auth/refresh-token`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();

                if (response.status === 401) {
                    console.log('REFRESH', data);
                    throw new Error(data?.error?.message || 'Failed to refresh token');
                }

                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error || data.error.message);
            }

            return data;
        } catch (error) {
            return error as Error;
        }
    }
}

export default APIService;
