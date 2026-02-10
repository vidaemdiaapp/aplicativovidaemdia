import { ZapayAuthResponse } from './types';

class ZapayAuth {
    private token: string | null = null;
    private refreshToken: string | null = null;

    async getToken(): Promise<string | null> {
        // In Mock Mode (no creds), we don't need a token
        if (!import.meta.env.VITE_ZAPAY_CLIENT_ID) return null;

        // Return cached token if valid (simplified)
        if (this.token) return this.token;

        return this.authenticate();
    }

    async authenticate(): Promise<string | null> {
        const clientId = import.meta.env.VITE_ZAPAY_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_ZAPAY_CLIENT_SECRET;

        if (!clientId || !clientSecret) return null;

        try {
            const response = await fetch(`${this.getBaseUrl()}/authentication`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
            });

            if (!response.ok) throw new Error('Auth failed');

            const data: ZapayAuthResponse = await response.json();
            this.token = data.access;
            this.refreshToken = data.refresh;
            return this.token;
        } catch (error) {
            console.error('[ZapayAuth] Error:', error);
            return null;
        }
    }

    private getBaseUrl(): string {
        const env = import.meta.env.VITE_ZAPAY_ENV || 'sandbox';
        return env === 'prod'
            ? 'https://api.usezapay.com.br'
            : 'https://api.sandbox.usezapay.com.br';
    }

    clear(): void {
        this.token = null;
        this.refreshToken = null;
    }
}

export const zapayAuth = new ZapayAuth();
