export interface ZapayAuthResponse {
    access: string;
    refresh: string;
}

export interface ZapayVehicle {
    plate: string;
    renavam?: string;
    uf: string;
}

export interface ZapayDebt {
    id: string;
    external_id: string;
    title: string;
    description: string;
    amount: number;
    due_date: string | null;
    type: 'fine' | 'tax' | 'license' | 'other';
    year?: string;
    status: 'pending' | 'paid' | 'expired';
    details?: string;
}

export interface ZapayInstallmentOption {
    installments: number;
    installment_value: number;
    total_value: number;
    interest_rate: number;
}

export interface ZapayError {
    code: string;
    message: string;
    details?: any;
}

export interface ZapayServiceResponse<T> {
    data: T | null;
    error: ZapayError | null;
}
