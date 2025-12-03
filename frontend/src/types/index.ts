// User types
export type UserRole =
  | "undefined"
  | "admin"
  | "doctor"
  | "medical_staff"
  | "receptionist"
  | "patient";

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  role: UserRole;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  age?: number;
  address?: string;
  gender?: string;
  password?: string;
  role?: UserRole;
}

export interface AdminUserUpdate {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  age?: number;
  address?: string;
  gender?: string;
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
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  password: string;
  role: UserRole;
}

// User creation interface for admin workflow
export interface UserCreate {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  password: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Staff types - Medical Staff (includes both medical_staff and receptionist roles)
export interface MedicalStaff {
  // Profile fields (nullable for incomplete profiles)
  id: number | null; // MedicalStaff table ID - null if profile incomplete
  job_title: string | null;
  department: string | null;
  shift_schedule: string | null;
  
  // User fields (always present)
  user_id: number; // User table ID
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole; // To distinguish between medical_staff and receptionist
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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

export interface PaginatedPatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedDoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Patient types
export interface Patient {
  // Profile fields (nullable for incomplete profiles)
  id: number | null; // Patient table ID - null if profile incomplete
  medical_record_number: string | null;
  emergency_contact: string | null;
  insurance_info: string | null;

  // User fields (always present)
  user_id: number; // User table ID
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  role: UserRole;

  // Status fields
  profile_completed: boolean;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface PatientProfileCreate {
  // Patient-specific fields only (user already exists)
  medical_record_number?: string;
  emergency_contact?: string;
  insurance_info?: string;
}

export interface PatientUpdate {
  // User fields
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  age?: number;
  address?: string;
  gender?: string;
  // Patient-specific fields
  medical_record_number?: string;
  emergency_contact?: string;
  insurance_info?: string;
}

// Combined interface for the new workflow (user creation + profile completion in one step)
export interface PatientCreate {
  // User fields
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  password: string;
  // Patient-specific fields
  medical_record_number?: string;
  emergency_contact?: string;
  insurance_info?: string;
}

// Doctor types
export interface Doctor {
  // Profile fields (nullable for incomplete profiles)
  id: number | null; // Doctor table ID - null if profile incomplete
  doctor_id: string | null;
  qualifications: string[] | null; // Array of qualifications
  department: string | null;
  specialization: string | null;
  license_number: string | null;

  // User fields (always present)
  user_id: number; // User table ID
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  role: UserRole;

  // Status fields
  profile_completed: boolean;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface DoctorProfileCreate {
  // Doctor-specific fields only (user already exists)
  doctor_id: string;
  qualifications: string[]; // Array of qualifications
  department?: string;
  specialization?: string;
  license_number?: string;
}

export interface DoctorUpdate {
  // User fields
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  age?: number;
  address?: string;
  gender?: string;
  // Doctor-specific fields
  doctor_id?: string;
  qualifications?: string[]; // Array of qualifications
  department?: string;
  specialization?: string;
  license_number?: string;
}

// Combined interface for the new workflow (user creation + profile completion in one step)
export interface DoctorCreate {
  // User fields
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: number;
  address: string;
  gender: string;
  password: string;
  // Doctor-specific fields
  doctor_id: string;
  qualifications: string[]; // Array of qualifications
  department?: string;
  specialization?: string;
  license_number?: string;
}


// Hospitalization types
export interface DoctorInfo {
  id: number;
  doctor_id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
}

export interface Hospitalization {
  id: number;
  patient_id: number;
  admission_date: string;
  discharge_date: string | null;
  diagnosis: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_age?: number;
  doctors?: DoctorInfo[];
}

export interface HospitalizationCreate {
  patient_id: number;
  admission_date: string;
  discharge_date?: string;
  diagnosis: string;
  summary?: string;
  doctor_ids?: number[];
}

export interface HospitalizationUpdate {
  admission_date?: string;
  discharge_date?: string;
  diagnosis?: string;
  summary?: string;
  doctor_ids?: number[];
}

// Prescription types
export interface MedicineItem {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  date: string;
  medicines: MedicineItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_age?: number;
}

export interface PrescriptionCreate {
  patient_id: number;
  start_date: string;
  end_date: string;
  medicines: MedicineItem[];
}

export interface PrescriptionUpdate {
  start_date?: string;
  end_date?: string;
  medicines?: MedicineItem[];
}

export interface PrescriptionBulkCreateResponse {
  created_count: number;
  prescriptions: Prescription[];
}

// Paginated response types
export interface PaginatedHospitalizationsResponse {
  hospitalizations: Hospitalization[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedPrescriptionsResponse {
  prescriptions: Prescription[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Filter params for API calls
export interface HospitalizationFilters {
  page?: number;
  page_size?: number;
  patient_id?: number;
  active_only?: boolean;
  search?: string;
}

export interface PrescriptionFilters {
  page?: number;
  page_size?: number;
  patient_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}
