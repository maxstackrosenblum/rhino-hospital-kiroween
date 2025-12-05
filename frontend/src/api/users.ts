import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminUserUpdate,
  PaginatedUsersResponse,
  User,
  UserCreate,
  UserCreateResponse,
} from "../types";
import {
  API_URL,
  fetchWithAuth,
  getAuthHeaders,
  handleApiError,
} from "./common";

// Users queries (admin only)
export const useUsers = (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  role?: string
) => {
  return useQuery<PaginatedUsersResponse>({
    queryKey: ["users", page, pageSize, search, role],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (role) params.append("role", role);

      const response = await fetchWithAuth(`${API_URL}/api/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    retry: false,
  });
};

export const useUser = (userId: number) => {
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: getAuthHeaders(),
      });
      return handleApiError<User>(response);
    },
    enabled: !!userId,
  });
};

// User mutations (admin only)
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UserCreate): Promise<UserCreateResponse> => {
      const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      return handleApiError<UserCreateResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      console.error("Failed to create user:", error.message);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: AdminUserUpdate;
    }): Promise<User> => {
      const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return handleApiError<User>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<{ message: string }> => {
      const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
      });
      return handleApiError<{ message: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
