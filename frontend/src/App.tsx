import { Box, Container } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import { useCurrentUser } from "./api";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppThemeProvider } from "./hooks/useTheme";
import AddReceptionist from "./pages/AddReceptionist";
import AddWorker from "./pages/AddWorker";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ReceptionistList from "./pages/ReceptionistList";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import WorkerList from "./pages/WorkerList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppContent() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const { data: user, isLoading, refetch } = useCurrentUser();

  const handleLogin = (accessToken: string) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    refetch();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.clear();
  };

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
              path="/receptionists/add"
              element={
                <ProtectedRoute user={user}>
                  <Container maxWidth="md" sx={{ py: 4 }}>
                    <AddReceptionist />
                  </Container>
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionists"
              element={
                <ProtectedRoute user={user}>
                  <Container maxWidth="xl" sx={{ py: 4 }}>
                    <ReceptionistList />
                  </Container>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workers/add"
              element={
                <ProtectedRoute user={user}>
                  <Container maxWidth="md" sx={{ py: 4 }}>
                    <AddWorker />
                  </Container>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workers"
              element={
                <ProtectedRoute user={user}>
                  <Container maxWidth="xl" sx={{ py: 4 }}>
                    <WorkerList />
                  </Container>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AppContent />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
