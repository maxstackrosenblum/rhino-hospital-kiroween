import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Doctor,
  DoctorCreate,
  DoctorProfileCreate,
  DoctorUpdate,
  PaginatedDoctorsResponse,
} from "../types";
import { API_URL, getAuthHeaders, handleApiError } from "./common";

// Doctor queries
export const useDoctors = (params?: {
  search?: string;
  page?: number;
  page_size?: number;
  includeDeleted?: boolean;
}) => {
  const {
    search,
    page = 1,
    page_size = 10,
    includeDeleted = false,
  } = params || {};

  return useQuery<PaginatedDoctorsResponse>({
    queryKey: ["doctors", { search, page, page_size, includeDeleted }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) searchParams.append("search", search);
      searchParams.append("page", page.toString());
      searchParams.append("page_size", page_size.toString());
      if (includeDeleted) searchParams.append("include_deleted", "true");

      const response = await fetch(`${API_URL}/api/doctors?${searchParams}`, {
        headers: getAuthHeaders(),
      });
      return handleApiError<PaginatedDoctorsResponse>(response);
    },
  });
};

export const useDoctor = (doctorId: number) => {
  return useQuery<Doctor>({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        headers: getAuthHeaders(),
      });
      return handleApiError<Doctor>(response);
    },
    enabled: !!doctorId,
  });
};

// Doctor mutations
// Combined workflow: Create user and complete doctor profile in one step
export const useCreateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorData: DoctorCreate): Promise<Doctor> => {
      const response = await fetch(`${API_URL}/api/doctors/create-with-user`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });
      return handleApiError<Doctor>(response);
    },
    onSuccess: () => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error: Error) => {
      console.error("Failed to create doctor:", error.message);
    },
  });
};

// New workflow: Complete doctor profile (for existing user)
export const useCompleteDoctorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileData: DoctorProfileCreate;
      userId?: number;
    }): Promise<Doctor> => {
      const url = data.userId
        ? `${API_URL}/api/doctors/profile?user_id=${data.userId}`
        : `${API_URL}/api/doctors/profile`;

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data.profileData),
      });
      return handleApiError<Doctor>(response);
    },
    onSuccess: () => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      // Invalidate current user to update profile completion status
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: Error) => {
      console.error("Failed to complete doctor profile:", error.message);
    },
  });
};

export const useUpdateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      doctorId,
      data,
    }: {
      doctorId: number;
      data: DoctorUpdate;
    }): Promise<Doctor> => {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleApiError<Doctor>(response);
    },
    onSuccess: (updatedDoctor) => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      // Update the specific doctor in cache
      queryClient.setQueryData(["doctor", updatedDoctor.id], updatedDoctor);
    },
    onError: (error: Error) => {
      console.error("Failed to update doctor:", error.message);
    },
  });
};

export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: number): Promise<void> => {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete doctor");
      }

      // DELETE endpoint returns 204 No Content, so no JSON to parse
      return;
    },
    onSuccess: (_, doctorId) => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      // Remove the specific doctor from cache
      queryClient.removeQueries({ queryKey: ["doctor", doctorId] });
    },
    onError: (error: Error) => {
      console.error("Failed to delete doctor:", error.message);
    },
  });
};
// Utility functions for handling qualifications
export const addQualification = (
  qualifications: string[],
  newQualification: string
): string[] => {
  if (!newQualification.trim()) return qualifications;
  if (qualifications.includes(newQualification.trim())) return qualifications;
  return [...qualifications, newQualification.trim()];
};

export const removeQualification = (
  qualifications: string[],
  qualificationToRemove: string
): string[] => {
  return qualifications.filter((q) => q !== qualificationToRemove);
};

export const updateQualification = (
  qualifications: string[],
  oldQualification: string,
  newQualification: string
): string[] => {
  if (!newQualification.trim())
    return removeQualification(qualifications, oldQualification);
  return qualifications.map((q) =>
    q === oldQualification ? newQualification.trim() : q
  );
};
