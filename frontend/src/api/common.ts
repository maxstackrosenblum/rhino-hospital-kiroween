// Common API utilities

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_URL}/api/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('refreshToken', data.refresh_token);
  }

  return data.access_token;
}

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Interface for Pydantic validation errors
interface ValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: any;
  ctx?: any;
  url?: string;
}

interface ApiErrorResponse {
  detail: string | ValidationError[];
}

export const handleApiError = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = "An error occurred";

    try {
      const errorData: ApiErrorResponse = await response.json();

      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // Handle Pydantic validation errors
        const validationErrors = errorData.detail as ValidationError[];
        if (validationErrors.length > 0) {
          // Create a user-friendly error message from validation errors
          const errorMessages = validationErrors.map((error) => {
            const field = error.loc[error.loc.length - 1]; // Get the field name
            return `${field}: ${error.msg}`;
          });
          errorMessage = errorMessages.join(", ");
        }
      }
    } catch (parseError) {
      // If we can't parse the error response, use status text
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }

    const error = new Error(errorMessage);
    // Attach the response status for additional context
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
};

// Enhanced fetch with automatic token refresh
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  
  // Add authorization header
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Make the request
  let response = await fetch(url, options);

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      // No refresh token, redirect to login
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
      const newToken = await refreshAccessToken();
      
      // Notify subscribers
      onTokenRefreshed(newToken);
      isRefreshing = false;

      // Retry original request with new token
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
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
