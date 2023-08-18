export interface User {
  response: {
    id: string;
    username: string;
    name: string;
    surname: string;
    is_superuser: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface UserLogin {
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

export interface UserRefreshToken {
  response?: {
    access_token: string;
  };
}