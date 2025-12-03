import { Box, Container } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import { useCurrentUser } from "./api";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import NetworkErrorHandler from "./components/NetworkErrorHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppThemeProvider } from "./hooks/useTheme";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import ForgotPassword from "./pages/ForgotPassword";
import Hospitalizations from "./pages/Hospitalizations";
import Login from "./pages/Login";
import MedicalStaffList from "./pages/MedicalStaffList";
import Patients from "./pages/Patients";
import Prescriptions from "./pages/Prescriptions";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";
import Users from "./pages/Users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
      // Add error handling for network issues
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
    },
  },
});

function AppContent() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const { data: user, isLoading, refetch } = useCurrentUser();

  const handleLogin = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem("token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    setToken(accessToken);
    refetch();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    queryClient.clear();
  };

  // Proactive token refresh - check every 5 minutes
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = async () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // If token expires in less than 5 minutes, refresh it
        if (expiresAt - now < fiveMinutes) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              localStorage.setItem('token', data.access_token);
              if (data.refresh_token) {
                localStorage.setItem('refreshToken', data.refresh_token);
              }
              setToken(data.access_token);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check token expiration:', error);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Then check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  if (isLoading && token) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <Router>
      <NetworkErrorHandler>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {user && <Navbar user={user} onLogout={handleLogout} />}
          <Box component="main" sx={{ flex: 1 }}>
            <ErrorBoundary>
              <Routes>
                <Route
                  path="/login"
                  element={
                    user ? (
                      <Navigate to="/" replace />
                    ) : (
                      <Login onLogin={handleLogin} />
                    )
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute user={user}>
                      <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Dashboard user={user} />
                      </Container>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute user={user}>
                      <Container maxWidth="md" sx={{ py: 4 }}>
                        <Profile user={user} />
                      </Container>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute user={user}>
                      <Container maxWidth="md" sx={{ py: 4 }}>
                        <Settings />
                      </Container>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute user={user}>
                      <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Users user={user} />
                      </Container>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patients"
                  element={
                    <ProtectedRoute user={user}>
                      <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Patients user={user} />
                      </Container>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors"
                  element={
                    <ProtectedRoute user={user}>
                      <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Doctors user={user} />
                      </Container>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-staff"
                  element={
                    <ProtectedRoute user={user}>
                      <MedicalStaffList user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hospitalizations"
                  element={
                    <ProtectedRoute user={user}>
                      <Hospitalizations user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions"
                  element={
                    <ProtectedRoute user={user}>
                      <Prescriptions user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    user ? (
                      <Navigate to="/" replace />
                    ) : (
                      <ForgotPassword />
                    )
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    user ? (
                      <Navigate to="/" replace />
                    ) : (
                      <ResetPassword />
                    )
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <ProtectedRoute user={user}>
                      <Sessions />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Box>
        </Box>
      </NetworkErrorHandler>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AppContent />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AppThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
