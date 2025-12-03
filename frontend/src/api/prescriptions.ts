import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Prescription, PrescriptionCreate, PrescriptionUpdate, PrescriptionBulkCreateResponse, PaginatedPrescriptionsResponse, PrescriptionFilters } from '../types';
import { API_URL, authenticatedFetch } from './common';

export const usePrescriptions = (filters?: PrescriptionFilters) => {
  return useQuery<PaginatedPrescriptionsResponse>({
    queryKey: ['prescriptions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());
      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      
      const url = `${API_URL}/api/prescriptions?${params.toString()}`;
      return authenticatedFetch<PaginatedPrescriptionsResponse>(url);
    },
  });
};

export const usePrescription = (id: number) => {
  return useQuery<Prescription>({
    queryKey: ['prescriptions', id],
    queryFn: async () => {
      return authenticatedFetch<Prescription>(`${API_URL}/api/prescriptions/${id}`);
    },
    enabled: !!id,
  });
};

export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PrescriptionCreate): Promise<PrescriptionBulkCreateResponse> => {
      return authenticatedFetch<PrescriptionBulkCreateResponse>(`${API_URL}/api/prescriptions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
};

export const useUpdatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PrescriptionUpdate }): Promise<Prescription> => {
      return authenticatedFetch<Prescription>(`${API_URL}/api/prescriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.id] });
    },
  });
};

export const useDeletePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await authenticatedFetch<void>(`${API_URL}/api/prescriptions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
};
