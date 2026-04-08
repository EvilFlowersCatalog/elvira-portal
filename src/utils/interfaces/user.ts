export interface IUser {
    id: string;
    username: string;
    name: string;
    surname: string;
    is_active: boolean;
    is_superuser: boolean;
    last_login: string;
    created_at: string;
    updated_at: string;
    permissions?: string[];
    catalog_permissions?: Record<string, string>;
    lcp_passphrase_hash?: string | null;
    lcp_passphrase_hint?: string | null;
}

export interface IUpdateUserPayload {
    name: string;
    surname: string;
    is_active: boolean;
    lcp_passphrase: string;
    lcp_passphrase_hint: string;
    password?: string;
}
