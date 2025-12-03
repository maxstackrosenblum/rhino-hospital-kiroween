import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Prescription, PrescriptionCreate, PrescriptionUpdate, PrescriptionBulkCreateResponse } from '../types';
import { API_URL, authenticatedFetch } from './common';

export const usePrescriptions = (patientId?: number) => {
  return useQuery<Prescription[]>({
    queryKey: ['prescriptions', patientId],
    queryFn: async () => {
      const url = patientId
        ? `${API_URL}/api/prescriptions?patient_id=${patientId}`
        : `${API_URL}/api/prescriptions`;
      return authenticatedFetch<Prescription[]>(url);
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
