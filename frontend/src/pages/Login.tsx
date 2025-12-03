import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Login({ onLogin }: any) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const endpoint = isLogin ? "/api/login" : "/api/register";
    const body = isLogin
      ? { username: formData.username, password: formData.password }
      : formData;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onLogin(data.access_token, data.refresh_token);
        } else {
          setIsLogin(true);
          setSuccess("Registration successful! Please login.");
        }
      } else {
        setError(data.detail || "An error occurred");
      }
    } catch (err) {
      setError("Connection error");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img
              src="/logo_big.png"
              alt="Hospital Logo"
              style={{
                height: "120px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography variant="h4" component="h1" gutterBottom align="center">
            {isLogin ? "Login" : "Register"}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {!isLogin && (
              <>
                <TextField
                  fullWidth
                  margin="normal"
                  name="first_name"
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  name="last_name"
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  size="small"
                  required
                />
              </>
            )}
            <TextField
              fullWidth
              margin="normal"
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              size="small"
              required
            />
            <TextField
              fullWidth
              margin="normal"
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              size="small"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {isLogin ? "Login" : "Register"}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link
              component="button"
              variant="body2"
              onClick={() => setIsLogin(!isLogin)}
              sx={{ cursor: "pointer" }}
            >
              {isLogin ? "Register" : "Login"}
            </Link>
          </Typography>

          {isLogin && (
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/forgot-password")}
                sx={{ cursor: "pointer" }}
              >
                Forgot Password?
              </Link>
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
