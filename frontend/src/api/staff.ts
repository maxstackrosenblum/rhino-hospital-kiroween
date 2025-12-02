import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Staff, StaffCreate, StaffUpdate, StaffListResponse,
  Receptionist, ReceptionistCreate, ReceptionistUpdate,
  Worker, WorkerCreate, WorkerUpdate
} from '../types';
import { API_URL, authenticatedFetch } from './common';

// Receptionist queries
export const useReceptionists = (search?: string) => {
  return useQuery<StaffListResponse>({
    queryKey: ['receptionists', search],
    queryFn: async () => {
      const url = search
        ? `${API_URL}/api/receptionists?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/receptionists`;
      return authenticatedFetch<StaffListResponse>(url);
    },
  });
};

export const useReceptionist = (id: number) => {
  return useQuery<Staff>({
    queryKey: ['receptionist', id],
    queryFn: async () => {
      return authenticatedFetch<Staff>(`${API_URL}/api/receptionists/${id}`);
    },
    enabled: !!id,
  });
};

// Receptionist mutations
export const useCreateReceptionist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReceptionistCreate): Promise<Receptionist> => {
      return authenticatedFetch<Receptionist>(`${API_URL}/api/receptionists`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] });
    },
  });
};

export const useUpdateReceptionist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: StaffUpdate;
    }): Promise<Staff> => {
      return authenticatedFetch<Staff>(`${API_URL}/api/receptionists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data: Staff, variables: { id: number; data: StaffUpdate }) => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] });
      queryClient.invalidateQueries({ queryKey: ['receptionist', variables.id] });
    },
  });
};

export const useDeleteReceptionist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      return authenticatedFetch<{ message: string }>(
        `${API_URL}/api/receptionists/${id}`,
        {
          method: 'DELETE',
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] });
    },
  });
};

// Worker queries
export const useWorkers = (search?: string) => {
  return useQuery<StaffListResponse>({
    queryKey: ['workers', search],
    queryFn: async () => {
      const url = search
        ? `${API_URL}/api/workers?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/workers`;
      return authenticatedFetch<StaffListResponse>(url);
    },
  });
};

export const useWorker = (id: number) => {
  return useQuery<Staff>({
    queryKey: ['worker', id],
    queryFn: async () => {
      return authenticatedFetch<Staff>(`${API_URL}/api/workers/${id}`);
    },
    enabled: !!id,
  });
};

// Worker mutations
export const useCreateWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WorkerCreate): Promise<Worker> => {
      return authenticatedFetch<Worker>(`${API_URL}/api/workers`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
};

export const useUpdateWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: StaffUpdate;
    }): Promise<Staff> => {
      return authenticatedFetch<Staff>(`${API_URL}/api/workers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data: Staff, variables: { id: number; data: StaffUpdate }) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', variables.id] });
    },
  });
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      return authenticatedFetch<{ message: string }>(
        `${API_URL}/api/workers/${id}`,
        {
          method: 'DELETE',
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
};
