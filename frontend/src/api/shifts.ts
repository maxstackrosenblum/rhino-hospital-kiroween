import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shift, ShiftCreate, ShiftUpdate, PaginatedShiftsResponse, ShiftFilters } from '../types';
import { API_URL, authenticatedFetch } from './common';

export const useShifts = (filters?: ShiftFilters) => {
  return useQuery<PaginatedShiftsResponse>({
    queryKey: ['shifts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.page_size) params.append('page_size', filters.page_size.toString());
      if (filters?.user_id) params.append('user_id', filters.user_id.toString());
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);
      
      const url = `${API_URL}/api/shifts?${params.toString()}`;
      return authenticatedFetch<PaginatedShiftsResponse>(url);
    },
  });
};

export const useShift = (id: number) => {
  return useQuery<Shift>({
    queryKey: ['shifts', id],
    queryFn: async () => {
      return authenticatedFetch<Shift>(`${API_URL}/api/shifts/${id}`);
    },
    enabled: !!id,
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ShiftCreate): Promise<Shift> => {
      return authenticatedFetch<Shift>(`${API_URL}/api/shifts`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ShiftUpdate }): Promise<Shift> => {
      return authenticatedFetch<Shift>(`${API_URL}/api/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', variables.id] });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await authenticatedFetch<void>(`${API_URL}/api/shifts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};
