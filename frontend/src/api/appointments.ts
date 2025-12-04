import { authenticatedFetch, API_URL } from './common';

export interface AppointmentCreate {
  doctor_id: number;
  appointment_date: string;
  disease: string;
}

export interface AppointmentUpdate {
  patient_id?: number;
  doctor_id?: number;
  appointment_date?: string;
  disease?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface AppointmentStatusUpdate {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  disease: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_age: number | null;
  patient_phone: string | null;
  doctor_first_name: string | null;
  doctor_last_name: string | null;
  doctor_specialization: string | null;
  doctor_department: string | null;
}

export interface PaginatedAppointments {
  appointments: Appointment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AvailableDoctor {
  doctor_id: number;
  doctor_user_id: number;
  first_name: string;
  last_name: string;
  specialization: string | null;
  department: string | null;
  shift_start: string;
  shift_end: string;
  total_appointments: number;
}

export interface AvailableDoctorsResponse {
  date: string;
  available_doctors: AvailableDoctor[];
}


export interface DoctorAvailableSlotsResponse {
  doctor_id: number;
  date: string;
  shift_start: string | null;
  shift_end: string | null;
  has_shift: boolean;
  available_slots: string[];
  booked_slots: string[];
}

export const appointmentsApi = {
  create: async (data: AppointmentCreate): Promise<Appointment> => {
    return authenticatedFetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (params?: {
    page?: number;
    page_size?: number;
    patient_id?: number;
    doctor_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedAppointments> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    if (params?.doctor_id) queryParams.append('doctor_id', params.doctor_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    return authenticatedFetch(`${API_URL}/api/appointments?${queryParams.toString()}`);
  },

  getById: async (id: number): Promise<Appointment> => {
    return authenticatedFetch(`${API_URL}/api/appointments/${id}`);
  },

  update: async (id: number, data: AppointmentUpdate): Promise<Appointment> => {
    return authenticatedFetch(`${API_URL}/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: number, data: AppointmentStatusUpdate): Promise<Appointment> => {
    return authenticatedFetch(`${API_URL}/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return authenticatedFetch(`${API_URL}/api/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  getAvailableDoctors: async (date: string): Promise<AvailableDoctorsResponse> => {
    return authenticatedFetch(`${API_URL}/api/appointments/available-doctors?date=${date}`);
  },

  getDoctorAvailableSlots: async (
    doctorId: number,
    date: string,
    slotDuration: number = 30
  ): Promise<DoctorAvailableSlotsResponse> => {
    return authenticatedFetch(
      `${API_URL}/api/appointments/doctors/${doctorId}/available-slots?date=${date}&slot_duration=${slotDuration}`
    );
  },
};
