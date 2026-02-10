import { zapayAuth } from './auth';

export class ZapayClient {
    private static getBaseUrl(): string {
        const env = import.meta.env.VITE_ZAPAY_ENV || 'sandbox';
        return env === 'prod'
            ? 'https://api.usezapay.com.br'
            : 'https://api.sandbox.usezapay.com.br';
    }

    static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await zapayAuth.getToken();
        const baseUrl = this.getBaseUrl();

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Logic for retry could be added here
            zapayAuth.clear();
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.message || 'API request failed',
                status: response.status,
                code: errorData.code
            };
        }

        return response.json();
    }
}
