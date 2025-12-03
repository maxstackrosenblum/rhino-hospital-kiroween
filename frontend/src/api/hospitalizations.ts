import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Hospitalization, HospitalizationCreate, HospitalizationUpdate } from '../types';
import { API_URL, authenticatedFetch } from './common';

export const useHospitalizations = (patientId?: number) => {
  return useQuery<Hospitalization[]>({
    queryKey: ['hospitalizations', patientId],
    queryFn: async () => {
      const url = patientId
        ? `${API_URL}/api/hospitalizations?patient_id=${patientId}`
        : `${API_URL}/api/hospitalizations`;
      return authenticatedFetch<Hospitalization[]>(url);
    },
  });
};

export const useHospitalization = (id: number) => {
  return useQuery<Hospitalization>({
    queryKey: ['hospitalizations', id],
    queryFn: async () => {
      return authenticatedFetch<Hospitalization>(`${API_URL}/api/hospitalizations/${id}`);
    },
    enabled: !!id,
  });
};

export const useCreateHospitalization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HospitalizationCreate): Promise<Hospitalization> => {
      return authenticatedFetch<Hospitalization>(`${API_URL}/api/hospitalizations`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitalizations'] });
    },
  });
};

export const useUpdateHospitalization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: HospitalizationUpdate }): Promise<Hospitalization> => {
      return authenticatedFetch<Hospitalization>(`${API_URL}/api/hospitalizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hospitalizations'] });
      queryClient.invalidateQueries({ queryKey: ['hospitalizations', variables.id] });
    },
  });
};

export const useDeleteHospitalization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await authenticatedFetch<void>(`${API_URL}/api/hospitalizations/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitalizations'] });
    },
  });
};
