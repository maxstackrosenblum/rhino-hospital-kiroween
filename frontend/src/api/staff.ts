import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  StaffListResponse,
  MedicalStaff, MedicalStaffCreate, MedicalStaffUpdate
} from '../types';
import { API_URL, authenticatedFetch } from './common';

// Medical Staff queries
export const useMedicalStaff = (search?: string) => {
  return useQuery<StaffListResponse>({
    queryKey: ['medical-staff', search],
    queryFn: async () => {
      const url = search
        ? `${API_URL}/api/medical-staff?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/medical-staff`;
      return authenticatedFetch<StaffListResponse>(url);
    },
  });
};

export const useMedicalStaffMember = (id: number) => {
  return useQuery<MedicalStaff>({
    queryKey: ['medical-staff', id],
    queryFn: async () => {
      return authenticatedFetch<MedicalStaff>(`${API_URL}/api/medical-staff/${id}`);
    },
    enabled: !!id,
  });
};

// Medical Staff mutations
export const useCreateMedicalStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MedicalStaffCreate): Promise<MedicalStaff> => {
      return authenticatedFetch<MedicalStaff>(`${API_URL}/api/medical-staff`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-staff'] });
    },
  });
};

export const useUpdateMedicalStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: MedicalStaffUpdate;
    }): Promise<MedicalStaff> => {
      return authenticatedFetch<MedicalStaff>(`${API_URL}/api/medical-staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data: MedicalStaff, variables: { id: number; data: MedicalStaffUpdate }) => {
      queryClient.invalidateQueries({ queryKey: ['medical-staff'] });
      queryClient.invalidateQueries({ queryKey: ['medical-staff', variables.id] });
    },
  });
};

export const useDeleteMedicalStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await authenticatedFetch<void>(
        `${API_URL}/api/medical-staff/${id}`,
        {
          method: 'DELETE',
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-staff'] });
    },
  });
};
