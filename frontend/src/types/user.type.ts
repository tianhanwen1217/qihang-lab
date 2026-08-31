type User = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  isLdap: boolean;
  totpVerified: boolean;
  hasPassword: boolean;
};

export type CreateUser = {
  username: string;
  email: string;
  password?: string;
  isActive?: boolean;
};

export type UpdateUser = {
  username?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
};

export type UpdateCurrentUser = {
  username?: string;
  email?: string;
};

export type CurrentUser = User & {};

export type UserHook = {
  user: CurrentUser | null;
  refreshUser: () => Promise<CurrentUser | null>;
};

export default User;
