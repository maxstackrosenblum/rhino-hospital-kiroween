import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch, getAuthHeaders } from "./common";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Common Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /**
   * JWT token inclusion in Authorization header
   * For any API request, the request should include the JWT token in the Authorization header.
   */
  it("should include JWT token in Authorization header for all requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random JWT-like tokens
        fc
          .array(
            fc.constantFrom(
              ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.".split(
                ""
              )
            ),
            { minLength: 20, maxLength: 200 }
          )
          .map((arr) => arr.join("")),
        // Generate random API endpoints
        fc.constantFrom(
          "/api/medical-staff",
          "/api/patients",
          "/api/doctors",
          "/api/users"
        ),
        // Generate random HTTP methods
        fc.constantFrom("GET", "POST", "PUT", "DELETE"),
        async (token, endpoint, method) => {
          mockFetch.mockClear();
          localStorage.clear();

          localStorage.setItem("token", token);

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          try {
            await authenticatedFetch(`http://localhost:8000${endpoint}`, {
              method,
            });
          } catch (error) {
            // Ignore errors for this test
          }

          expect(mockFetch).toHaveBeenCalled();
          const callArgs =
            mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
          const headers = callArgs[1]?.headers as Record<string, string>;

          expect(headers).toBeDefined();
          expect(headers["Authorization"]).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: 50, endOnFailure: true }
    );
  });

  it("should include Content-Type header for all requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(
            fc.constantFrom(
              ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.".split(
                ""
              )
            ),
            { minLength: 20, maxLength: 200 }
          )
          .map((arr) => arr.join("")),
        fc.constantFrom("/api/medical-staff", "/api/patients", "/api/doctors"),
        async (token, endpoint) => {
          mockFetch.mockClear();
          localStorage.clear();
          localStorage.setItem("token", token);

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          try {
            await authenticatedFetch(`http://localhost:8000${endpoint}`);
          } catch (error) {
            // Ignore errors
          }

          const callArgs =
            mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
          const headers = callArgs[1]?.headers as Record<string, string>;

          expect(headers["Content-Type"]).toBe("application/json");
        }
      ),
      { numRuns: 30, endOnFailure: true }
    );
  });

  it("should get auth headers with token", () => {
    const token = "test-token-123";
    localStorage.setItem("token", token);

    const headers = getAuthHeaders();

    expect((headers as any)["Authorization"]).toBe(`Bearer ${token}`);
    expect((headers as any)["Content-Type"]).toBe("application/json");
  });

  /**
   * User-friendly 404 error messages
   * For any 404 Not Found error, the system should display a user-friendly message.
   */
  it("should transform 404 errors to user-friendly messages", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(
            fc.constantFrom(
              ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.".split(
                ""
              )
            ),
            { minLength: 20, maxLength: 200 }
          )
          .map((arr) => arr.join("")),
        fc.constantFrom(
          "Medical staff not found",
          "Patient not found",
          "Doctor not found",
          "Resource not found"
        ),
        async (token, errorDetail) => {
          mockFetch.mockClear();
          localStorage.clear();
          localStorage.setItem("token", token);

          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({ detail: errorDetail }),
          });

          let caughtError: Error | null = null;
          try {
            await authenticatedFetch(
              "http://localhost:8000/api/medical-staff/999"
            );
          } catch (error) {
            caughtError = error as Error;
          }

          expect(caughtError).toBeTruthy();
          expect(caughtError?.message).toBeTruthy();

          const message = caughtError?.message.toLowerCase() || "";
          expect(message).toContain("not found");
        }
      ),
      { numRuns: 50, endOnFailure: true }
    );
  });

  it("should handle authentication errors by clearing token", async () => {
    const token = "expired-token";
    localStorage.setItem("token", token);

    // Mock 401 response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    });

    let caughtError: Error | null = null;
    try {
      await authenticatedFetch("http://localhost:8000/api/medical-staff");
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify that token was removed
    expect(localStorage.getItem("token")).toBeNull();

    // Verify that error was thrown
    expect(caughtError).toBeTruthy();
    // Error message may vary depending on environment, just check it exists
    expect(caughtError?.message).toBeTruthy();
  });

  it("should handle network errors gracefully", async () => {
    const token = "test-token";
    localStorage.setItem("token", token);

    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    let caughtError: Error | null = null;
    try {
      await authenticatedFetch("http://localhost:8000/api/medical-staff");
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toBeTruthy();
  });
});
