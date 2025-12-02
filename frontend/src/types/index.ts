// User types
export type UserRole = "undefined" | "admin" | "doctor" | "receptionist";

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

// Patient types
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  city: string;
  email: string;
  age: number;
  address: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  city: string;
  email: string;
  age: number;
  address: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  gender?: string;
  phone?: string;
  city?: string;
  email?: string;
  age?: number;
  address?: string;
}

// Doctor types
export interface Doctor {
  id: number;
  doctor_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  city: string;
  email: string;
  age: number;
  address: string;
  qualification: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DoctorCreate {
  doctor_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  city: string;
  email: string;
  age: number;
  address: string;
  qualification: string;
}

export interface DoctorUpdate {
  doctor_id?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  phone?: string;
  city?: string;
  email?: string;
  age?: number;
  address?: string;
  qualification?: string;
}
