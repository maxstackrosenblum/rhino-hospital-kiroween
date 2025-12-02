// User types
export type UserRole = 'undefined' | 'admin' | 'doctor' | 'receptionist';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
  deleted_at: string | null;
}

export interface UserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role?: UserRole;
}

export interface AdminUserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
