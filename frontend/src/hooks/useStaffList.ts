import { useState, useCallback } from 'react';
import {
  useReceptionists,
  useWorkers,
  useDeleteReceptionist,
  useDeleteWorker,
  useUpdateReceptionist,
  useUpdateWorker,
} from '../api/staff';
import { Staff, StaffUpdate } from '../types';

export type StaffType = 'receptionists' | 'workers';

interface UseStaffListReturn {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshList: () => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
  updateStaff: (id: number, data: StaffUpdate) => Promise<void>;
}

/**
 * Custom hook for managing staff list with search, update, and delete operations
 * Provides state management for staff list, loading states, and error handling
 * 
 * @param staffType - Type of staff ('receptionists' or 'workers')
 * @returns Object containing staff list, loading state, error state, and CRUD operations
 */
export function useStaffList(staffType: StaffType): UseStaffListReturn {
  const [searchQuery, setSearchQuery] = useState('');

  // Select the appropriate query hook based on staff type
  const receptionistsQuery = useReceptionists(staffType === 'receptionists' ? searchQuery : undefined);
  const workersQuery = useWorkers(staffType === 'workers' ? searchQuery : undefined);
  
  const query = staffType === 'receptionists' ? receptionistsQuery : workersQuery;

  // Select the appropriate mutation hooks based on staff type
  const deleteReceptionistMutation = useDeleteReceptionist();
  const deleteWorkerMutation = useDeleteWorker();
  const updateReceptionistMutation = useUpdateReceptionist();
  const updateWorkerMutation = useUpdateWorker();

  const deleteMutation = staffType === 'receptionists' ? deleteReceptionistMutation : deleteWorkerMutation;
  const updateMutation = staffType === 'receptionists' ? updateReceptionistMutation : updateWorkerMutation;

  // Extract staff list from query data
  const staff = query.data?.items || [];
  const loading = query.isLoading || deleteMutation.isPending || updateMutation.isPending;
  
  // Transform error to user-friendly message
  const error = query.error 
    ? transformErrorMessage(query.error.message)
    : deleteMutation.error
    ? transformErrorMessage(deleteMutation.error.message)
    : updateMutation.error
    ? transformErrorMessage(updateMutation.error.message)
    : null;

  // Refresh the staff list
  const refreshList = useCallback(async () => {
    await query.refetch();
  }, [query]);

  // Delete a staff member with optimistic updates
  const deleteStaff = useCallback(async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error is already captured in the mutation state
      throw error;
    }
  }, [deleteMutation]);

  // Update a staff member with optimistic updates
  const updateStaff = useCallback(async (id: number, data: StaffUpdate) => {
    try {
      await updateMutation.mutateAsync({ id, data });
    } catch (error) {
      // Error is already captured in the mutation state
      throw error;
    }
  }, [updateMutation]);

  return {
    staff,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refreshList,
    deleteStaff,
    updateStaff,
  };
}

/**
 * Transform technical error messages into user-friendly messages
 * Handles common error scenarios like network errors, not found, etc.
 */
function transformErrorMessage(message: string): string {
  if (message.includes('Failed to fetch') || message.includes('Network')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (message.includes('Authentication required') || message.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'The requested staff member was not found.';
  }
  
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'An unexpected error occurred. Please try again later.';
  }
  
  // Return the original message if no specific transformation applies
  return message || 'An error occurred. Please try again.';
}
