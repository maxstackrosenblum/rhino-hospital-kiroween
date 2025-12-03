import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Hospitalization, HospitalizationCreate, HospitalizationUpdate, PaginatedHospitalizationsResponse, HospitalizationFilters } from '../types';
import { API_URL, authenticatedFetch } from './common';

export const useHospitalizations = (filters?: HospitalizationFilters) => {
  return useQuery<PaginatedHospitalizationsResponse>({
    queryKey: ['hospitalizations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());
      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.active_only) params.append('active_only', 'true');
      if (filters?.search) params.append('search', filters.search);
      
      const url = `${API_URL}/api/hospitalizations?${params.toString()}`;
      return authenticatedFetch<PaginatedHospitalizationsResponse>(url);
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
