import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminUserUpdate, User } from '../types';
import { API_URL, getAuthHeaders, handleApiError } from './common';

// Users queries (admin only)
export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
};

// User mutations (admin only)
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: AdminUserUpdate }): Promise<User> => {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleApiError<User>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleApiError<{ message: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
