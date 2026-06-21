import { client } from './client';

interface AuthTokenResponse {
  access_token: string;
  username: string;
  isSuperAdmin: boolean;
}

export interface AdminRow {
  username: string;
  createdAt: string;
  isSuperAdmin: boolean;
}

export const authApi = {
  // Whether a first admin has been created yet
  status: () => client.get<{ hasAdmin: boolean }>('/auth/status'),

  // Register an admin. The shared client adds the token automatically, so when
  // a super admin is logged in this creates an additional admin.
  register: (username: string, password: string) =>
    client.post<AuthTokenResponse>('/auth/register', { username, password }),

  // Log in and receive a JWT
  login: (username: string, password: string) =>
    client.post<AuthTokenResponse>('/auth/login', { username, password }),

  // Current admin + role (protected)
  me: () => client.get<{ username: string; isSuperAdmin: boolean }>('/auth/me'),

  // List all admins (protected)
  admins: () => client.get<AdminRow[]>('/auth/admins'),

  // Remove an admin (super admin only)
  removeAdmin: (username: string) =>
    client.delete<{ removed: string }>(`/auth/admins/${username}`),
};
