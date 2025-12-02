// Common API utilities

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const handleApiError = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'An error occurred');
  }
  return response.json();
};

// Enhanced fetch wrapper with retry logic and error handling
interface FetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
}

export const fetchWithRetry = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { maxRetries = 2, retryDelay = 1000, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Handle 401/403 errors by redirecting to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      // Handle other errors
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'An error occurred');
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth errors or non-network errors
      if (
        error instanceof Error &&
        (error.message.includes('Authentication required') ||
          error.message.includes('Failed to fetch') === false)
      ) {
        throw error;
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
};

// Authenticated fetch wrapper
export const authenticatedFetch = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const headers = getAuthHeaders();
  return fetchWithRetry<T>(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};
