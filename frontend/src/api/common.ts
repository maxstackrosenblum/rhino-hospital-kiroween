// Common API utilities

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
