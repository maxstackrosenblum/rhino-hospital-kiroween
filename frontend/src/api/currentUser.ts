import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, UserUpdate } from '../types';
import { API_URL, getAuthHeaders, handleApiError } from './common';

// Current user queries
export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!localStorage.getItem('token'),
  });
};

// Current user mutations
export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UserUpdate): Promise<User> => {
      const response = await fetch(`${API_URL}/api/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
      const response = await fetch(`${API_URL}/api/me`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleApiError<{ message: string }>(response);
    },
  });
};
