import { refreshAccessToken } from '../api/auth';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('token');
  
  // Add authorization header if token exists
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // Make the request
  let response = await fetch(url, options);

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      // No refresh token, user needs to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    // If already refreshing, wait for it
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          };
          resolve(fetch(url, options));
        });
      });
    }

    isRefreshing = true;

    try {
      // Refresh the token
      const data = await refreshAccessToken(refreshToken);
      
      // Store new tokens
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }

      // Notify subscribers
      onTokenRefreshed(data.access_token);
      isRefreshing = false;

      // Retry original request with new token
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${data.access_token}`,
      };
      response = await fetch(url, options);
    } catch (error) {
      isRefreshing = false;
      // Refresh failed, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}

// Helper to check if token is about to expire (within 5 minutes)
export function shouldRefreshToken(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expiresAt - now < fiveMinutes;
  } catch {
    return false;
  }
}

// Proactively refresh token if needed
export async function proactiveTokenRefresh(): Promise<void> {
  if (!shouldRefreshToken()) return;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return;

  try {
    const data = await refreshAccessToken(refreshToken);
    localStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refreshToken', data.refresh_token);
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
}
