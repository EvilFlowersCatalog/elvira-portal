export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    accesToken: string;
    user: {
      login: string;
    }
}
