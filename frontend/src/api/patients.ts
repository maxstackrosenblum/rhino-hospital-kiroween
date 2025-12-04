import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PaginatedPatientsResponse,
  Patient,
  PatientCreate,
  PatientProfileCreate,
  PatientUpdate,
} from "../types";
import { API_URL, getAuthHeaders, handleApiError } from "./common";

// Patient queries
export const usePatients = (params?: {
  search?: string;
  page?: number;
  page_size?: number;
  includeDeleted?: boolean;
  hospitalizationStatus?: string;
}) => {
  const {
    search,
    page = 1,
    page_size = 10,
    includeDeleted = false,
    hospitalizationStatus,
  } = params || {};

  return useQuery<PaginatedPatientsResponse>({
    queryKey: ["patients", { search, page, page_size, includeDeleted, hospitalizationStatus }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) searchParams.append("search", search);
      searchParams.append("page", page.toString());
      searchParams.append("page_size", page_size.toString());
      if (includeDeleted) searchParams.append("include_deleted", "true");
      if (hospitalizationStatus) searchParams.append("hospitalization_status", hospitalizationStatus);

      const response = await fetch(`${API_URL}/api/patients?${searchParams}`, {
        headers: getAuthHeaders(),
      });
      return handleApiError<PaginatedPatientsResponse>(response);
    },
  });
};

export const usePatient = (patientId: number) => {
  return useQuery<Patient>({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        headers: getAuthHeaders(),
      });
      return handleApiError<Patient>(response);
    },
    enabled: !!patientId,
  });
};

// Patient mutations
// Combined workflow: Create user and complete patient profile in one step
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientData: PatientCreate): Promise<Patient> => {
      const response = await fetch(`${API_URL}/api/patients/create-with-user`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(patientData),
      });
      return handleApiError<Patient>(response);
    },
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error: Error) => {
      console.error("Failed to create patient:", error.message);
    },
  });
};

// New workflow: Complete patient profile (for existing user)
export const useCompletePatientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileData: PatientProfileCreate;
      userId?: number;
    }): Promise<Patient> => {
      const url = data.userId
        ? `${API_URL}/api/patients/profile?user_id=${data.userId}`
        : `${API_URL}/api/patients/profile`;

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data.profileData),
      });
      return handleApiError<Patient>(response);
    },
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      // Invalidate current user to update profile completion status
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: Error) => {
      console.error("Failed to complete patient profile:", error.message);
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      data,
    }: {
      patientId: number;
      data: PatientUpdate;
    }): Promise<Patient> => {
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleApiError<Patient>(response);
    },
    onSuccess: (updatedPatient) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      // Update the specific patient in cache
      queryClient.setQueryData(["patient", updatedPatient.id], updatedPatient);
    },
    onError: (error: Error) => {
      console.error("Failed to update patient:", error.message);
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: number): Promise<void> => {
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete patient");
      }

      // DELETE endpoint returns 204 No Content, so no JSON to parse
      return;
    },
    onSuccess: (_, patientId) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      // Remove the specific patient from cache
      queryClient.removeQueries({ queryKey: ["patient", patientId] });
    },
    onError: (error: Error) => {
      console.error("Failed to delete patient:", error.message);
    },
  });
};

// Get non-patient users
export const useNonPatientUsers = (params?: {
  search?: string;
  page?: number;
  page_size?: number;
}) => {
  const {
    search,
    page = 1,
    page_size = 10,
  } = params || {};

  return useQuery({
    queryKey: ["nonPatientUsers", { search, page, page_size }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) searchParams.append("search", search);
      searchParams.append("page", page.toString());
      searchParams.append("page_size", page_size.toString());

      const response = await fetch(
        `${API_URL}/api/patients/non-patients/list?${searchParams}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return handleApiError(response);
    },
  });
};

// Convert user to patient
export const useConvertToPatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      profileData,
    }: {
      userId: number;
      profileData: PatientProfileCreate;
    }): Promise<Patient> => {
      const response = await fetch(
        `${API_URL}/api/patients/${userId}/convert-to-patient`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(profileData),
        }
      );
      return handleApiError<Patient>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["nonPatientUsers"] });
    },
    onError: (error: Error) => {
      console.error("Failed to convert user to patient:", error.message);
    },
  });
};
