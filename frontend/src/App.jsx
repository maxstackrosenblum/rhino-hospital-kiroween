import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AppThemeProvider } from "./hooks/useTheme.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Users from "./pages/Users.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Theme initialization is now handled by AppThemeProvider

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.removeItem("token");
        setToken(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (accessToken) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <AppThemeProvider>
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
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider>
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
                      <Profile
                        user={user}
                        token={token}
                        onUserUpdate={handleUserUpdate}
                      />
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
                      <Users user={user} token={token} />
                    </Container>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </AppThemeProvider>
  );
}

export default App;
