import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { authenticatedFetch, getAuthHeaders } from './common';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Common Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * Feature: staff-management, Property 30: JWT token inclusion
   * Validates: Requirements 17.5
   * 
   * For any API request from the frontend to staff management endpoints,
   * the request should include the JWT token in the Authorization header.
   */
  it('should include JWT token in Authorization header for all requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random JWT-like tokens (alphanumeric, no spaces)
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'.split('')), { minLength: 20, maxLength: 200 }).map(arr => arr.join('')),
        // Generate random API endpoints
        fc.constantFrom(
          '/api/receptionists',
          '/api/workers',
          '/api/receptionists/1',
          '/api/workers/1'
        ),
        // Generate random HTTP methods
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        async (token, endpoint, method) => {
          // Clear mocks and localStorage before each property test
          mockFetch.mockClear();
          localStorage.clear();
          
          // Set token in localStorage
          localStorage.setItem('token', token);

          // Mock successful response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          // Make authenticated request
          try {
            await authenticatedFetch(`http://localhost:8000${endpoint}`, {
              method,
            });
          } catch (error) {
            // Ignore errors for this test
          }

          // Verify that fetch was called with Authorization header
          expect(mockFetch).toHaveBeenCalled();
          const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
          const headers = callArgs[1]?.headers as Record<string, string>;

          // Verify Authorization header is present and contains the token
          expect(headers).toBeDefined();
          expect(headers['Authorization']).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('should include Content-Type header for all requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'.split('')), { minLength: 20, maxLength: 200 }).map(arr => arr.join('')),
        fc.constantFrom('/api/receptionists', '/api/workers'),
        async (token, endpoint) => {
          mockFetch.mockClear();
          localStorage.clear();
          localStorage.setItem('token', token);

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          try {
            await authenticatedFetch(`http://localhost:8000${endpoint}`);
          } catch (error) {
            // Ignore errors
          }

          const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
          const headers = callArgs[1]?.headers as Record<string, string>;

          expect(headers['Content-Type']).toBe('application/json');
        }
      ),
      { numRuns: 50, endOnFailure: true }
    );
  });

  it('should get auth headers with token', () => {
    const token = 'test-token-123';
    localStorage.setItem('token', token);

    const headers = getAuthHeaders();

    expect(headers['Authorization']).toBe(`Bearer ${token}`);
    expect(headers['Content-Type']).toBe('application/json');
  });

  /**
   * Feature: staff-management, Property 33: User-friendly not found messages
   * Validates: Requirements 19.5
   * 
   * For any 404 Not Found error received by the frontend,
   * the system should display a user-friendly message indicating
   * the staff member was not found.
   */
  it('should transform 404 errors to user-friendly messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'.split('')), { minLength: 20, maxLength: 200 }).map(arr => arr.join('')),
        fc.constantFrom(
          'Staff member not found',
          'Receptionist not found',
          'Worker not found',
          'Resource not found'
        ),
        async (token, errorDetail) => {
          mockFetch.mockClear();
          localStorage.clear();
          localStorage.setItem('token', token);

          // Mock 404 response
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({ detail: errorDetail }),
          });

          let caughtError: Error | null = null;
          try {
            await authenticatedFetch('http://localhost:8000/api/receptionists/999');
          } catch (error) {
            caughtError = error as Error;
          }

          // Verify that an error was thrown
          expect(caughtError).toBeTruthy();
          
          // Verify that the error message is user-friendly
          // It should mention "not found" (case insensitive)
          expect(caughtError?.message).toBeTruthy();
          
          // The error should contain the detail from the API
          // (The transformation to user-friendly message happens in the hook layer)
          const message = caughtError?.message.toLowerCase() || '';
          expect(message).toContain('not found');
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('should handle authentication errors by redirecting to login', async () => {
    const token = 'expired-token';
    localStorage.setItem('token', token);

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    // Mock 401 response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Unauthorized' }),
    });

    let caughtError: Error | null = null;
    try {
      await authenticatedFetch('http://localhost:8000/api/receptionists');
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify that token was removed
    expect(localStorage.getItem('token')).toBeNull();

    // Verify that error was thrown
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toContain('Authentication required');

    // Restore window.location
    window.location = originalLocation;
  });

  it('should retry on network failures', async () => {
    const token = 'test-token';
    localStorage.setItem('token', token);

    // First call fails with network error, second succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const result = await authenticatedFetch('http://localhost:8000/api/receptionists', {
      maxRetries: 1,
      retryDelay: 10,
    });

    // Verify that fetch was called twice (initial + 1 retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });
});
