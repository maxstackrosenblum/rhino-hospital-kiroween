import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, UserUpdate } from '../types';
import { API_URL, fetchWithAuth, handleApiError } from './common';

// Current user queries
export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetchWithAuth(`${API_URL}/api/me`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!localStorage.getItem('token'),
    retry: false, // Don't retry on 401, let fetchWithAuth handle it
  });
};

// Current user mutations
export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UserUpdate): Promise<User> => {
      const response = await fetchWithAuth(`${API_URL}/api/me`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return handleApiError<User>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useDeleteCurrentUser = () => {
  return useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const response = await fetchWithAuth(`${API_URL}/api/me`, {
        method: 'DELETE',
      });
      return handleApiError<{ message: string }>(response);
    },
  });
};
