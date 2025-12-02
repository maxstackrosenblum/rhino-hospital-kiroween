// User types
export type UserRole = 'undefined' | 'admin' | 'doctor' | 'receptionist' | 'worker';

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

// Staff types - Receptionist
export interface Receptionist {
  id: number;
  user_id: number;
  shift_schedule: string | null;
  desk_number: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReceptionistCreate {
  user_id: number;
  shift_schedule?: string;
  desk_number?: string;
}

export interface ReceptionistUpdate {
  shift_schedule?: string;
  desk_number?: string;
}

// Staff types - Worker
export interface Worker {
  id: number;
  user_id: number;
  job_title: string | null;
  department: string | null;
  shift_schedule: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkerCreate {
  user_id: number;
  job_title?: string;
  department?: string;
  shift_schedule?: string;
}

export interface WorkerUpdate {
  job_title?: string;
  department?: string;
  shift_schedule?: string;
}

export interface StaffListResponse {
  items: (Receptionist | Worker)[];
  total: number;
}

// Legacy types for backward compatibility (to be removed)
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

export interface ApiError {
  detail: string;
  status_code: number;
  error_code?: string;
  fields?: Record<string, string>;
}
// Pagination types
export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
