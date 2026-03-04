export interface User {
    id: string;
    email: string;
    password?: string;
    name?: string;
    otp?: string;
    otp_expiry?: Date;
    reset_token?: string;
    reset_token_expiry?: Date;
    created_at?: Date;
}
