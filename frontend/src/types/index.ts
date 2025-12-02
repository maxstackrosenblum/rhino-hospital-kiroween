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

// Staff types
export interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface StaffCreate {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface StaffUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface StaffListResponse {
  items: Staff[];
  total: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
  error_code?: string;
  fields?: Record<string, string>;
}
