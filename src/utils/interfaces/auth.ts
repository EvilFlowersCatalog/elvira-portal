import { ICatalogPermisions } from './users';

export interface IAuth {
  userId: string;
  username: string;
  isSuperUser: boolean;
  token: string;
  refreshToken: string;
}

export interface IUpdatedAuth {
  userId?: string;
  username?: string;
  isSuperUser?: boolean;
  token?: string;
  refreshToken?: string;
}

export interface IAuthCredentials {
  username: string;
  password: string;
}

export interface ILoginResponse {
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
      catalog_permissions: { [key: string]: string };
    };
  };
}

export interface IRefreshTokenResponse {
  response: {
    access_token: string;
  };
}

export interface IVerifyAdminResponse {
  response: {
    is_superuser: boolean;
  };
}
