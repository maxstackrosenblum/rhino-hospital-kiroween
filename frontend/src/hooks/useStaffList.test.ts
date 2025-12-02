import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStaffList } from './useStaffList';
import * as staffApi from '../api/staff';
import fc from 'fast-check';
import React, { ReactNode } from 'react';

// Mock the staff API module
vi.mock('../api/staff');

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useStaffList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: staff-management, Property 24: Network error handling
   * Validates: Requirements 15.5
   * 
   * For any network error or timeout when communicating with the backend,
   * the frontend should display an appropriate error message and provide
   * the user with retry options.
   */
  it('should handle network errors with user-friendly messages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('receptionists', 'workers'),
        fc.oneof(
          fc.constant('Failed to fetch'),
          fc.constant('Network request failed'),
          fc.constant('NetworkError'),
          fc.constant('TypeError: Failed to fetch')
        ),
        (staffType, networkErrorMessage) => {
          // Mock the query hooks to return network errors
          const mockError = new Error(networkErrorMessage);
          
          if (staffType === 'receptionists') {
            vi.mocked(staffApi.useReceptionists).mockReturnValue({
              data: undefined,
              isLoading: false,
              error: mockError,
              refetch: vi.fn(),
            } as any);
            vi.mocked(staffApi.useWorkers).mockReturnValue({
              data: undefined,
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            } as any);
          } else {
            vi.mocked(staffApi.useReceptionists).mockReturnValue({
              data: undefined,
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            } as any);
            vi.mocked(staffApi.useWorkers).mockReturnValue({
              data: undefined,
              isLoading: false,
              error: mockError,
              refetch: vi.fn(),
            } as any);
          }

          // Mock mutation hooks
          vi.mocked(staffApi.useDeleteReceptionist).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            error: null,
          } as any);
          vi.mocked(staffApi.useDeleteWorker).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            error: null,
          } as any);
          vi.mocked(staffApi.useUpdateReceptionist).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            error: null,
          } as any);
          vi.mocked(staffApi.useUpdateWorker).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            error: null,
          } as any);

          const { result } = renderHook(() => useStaffList(staffType as any), {
            wrapper: createWrapper(),
          });

          // Verify that error is transformed to user-friendly message
          expect(result.current.error).toBeTruthy();
          expect(result.current.error).toContain('Unable to connect to the server');
          expect(result.current.error).toContain('check your internet connection');
          
          // Verify that the error doesn't expose technical details
          expect(result.current.error).not.toContain('Failed to fetch');
          expect(result.current.error).not.toContain('NetworkError');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide retry functionality through refreshList', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({ data: { items: [], total: 0 } });
    
    vi.mocked(staffApi.useReceptionists).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);
    vi.mocked(staffApi.useWorkers).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(staffApi.useDeleteReceptionist).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);
    vi.mocked(staffApi.useDeleteWorker).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);
    vi.mocked(staffApi.useUpdateReceptionist).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);
    vi.mocked(staffApi.useUpdateWorker).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useStaffList('receptionists'), {
      wrapper: createWrapper(),
    });

    // Call refreshList to retry
    await result.current.refreshList();

    // Verify that refetch was called
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle 404 errors with appropriate messages', () => {
    const mockError = new Error('Staff member not found');
    
    vi.mocked(staffApi.useReceptionists).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(staffApi.useWorkers).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(staffApi.useDeleteReceptionist).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: mockError,
    } as any);
    vi.mocked(staffApi.useDeleteWorker).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);
    vi.mocked(staffApi.useUpdateReceptionist).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);
    vi.mocked(staffApi.useUpdateWorker).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useStaffList('receptionists'), {
      wrapper: createWrapper(),
    });

    // Verify that 404 error is transformed appropriately
    expect(result.current.error).toContain('not found');
  });
});
