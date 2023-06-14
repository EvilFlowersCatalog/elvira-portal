export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  response: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      username: string;
      name: string;
      surname: string;
      is_superuser: boolean;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      permissions: string[];
    };
  };
}

export interface RefreshTokenResponse {
  response?: {
    access_token: string;
  };
}
