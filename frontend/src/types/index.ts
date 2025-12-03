// User types
export type UserRole = 'undefined' | 'admin' | 'doctor' | 'medical_staff';

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
  phone?: string;
  city?: string;
  age?: number;
  address?: string;
  gender?: string;
  role?: UserRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Staff types - Medical Staff
export interface MedicalStaff {
  id: number;
  user_id: number;
  job_title: string | null;
  department: string | null;
  shift_schedule: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface MedicalStaffCreate {
  user_id: number;
  job_title?: string;
  department?: string;
  shift_schedule?: string;
}

export interface MedicalStaffUpdate {
  job_title?: string;
  department?: string;
  shift_schedule?: string;
}

export interface StaffListResponse {
  items: MedicalStaff[];
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
