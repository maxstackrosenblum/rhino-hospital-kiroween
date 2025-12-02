import { useMutation } from '@tanstack/react-query';
import { LoginCredentials, RegisterData, TokenResponse } from '../types';
import { API_URL } from './common';

// Auth mutations
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<TokenResponse> => {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }
      return response.json();
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterData): Promise<TokenResponse> => {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
      return response.json();
    },
  });
};
