import { useMutation } from '@tanstack/react-query';
import { LoginCredentials, RegisterData, TokenResponse, PasswordChangeRequest } from '../types';
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

export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await fetch(`${API_URL}/api/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  
  return response.json();
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: { current_password: string; new_password: string }): Promise<{ message: string }> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Password change failed');
      }
      
      return response.json();
    },
  });
};
