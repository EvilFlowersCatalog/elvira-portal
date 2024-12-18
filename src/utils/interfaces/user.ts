export interface IUsersList {
  items: IUser[];
}

export interface IUser {
  id: string;
  username: string;
  name: string;
  surname: string;
  is_superuser: boolean;
  is_active: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}
