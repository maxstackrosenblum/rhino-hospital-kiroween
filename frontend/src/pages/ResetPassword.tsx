import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PasswordStrengthIndicator from "../components/users/PasswordStrengthIndicator";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      setVerifying(false);
      return;
    }

    // Verify token
    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/password-reset/verify-token?token=${token}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired token");
        return res.json();
      })
      .then((data) => {
        setTokenValid(true);
        setUserEmail(data.email || "");
        setVerifying(false);
      })
      .catch((err) => {
        setError((err as any).message || "Invalid or expired reset link");
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/password-reset/reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: password }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        // Handle detailed error response from password policy
        if (data.detail && typeof data.detail === "object" && data.detail.errors) {
          throw new Error(data.detail.errors.join(". "));
        }
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError((err as any).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Verifying reset link...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!tokenValid) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Invalid Link
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || "This password reset link is invalid or has expired."}
          </Alert>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate("/forgot-password")}
          >
            Request New Link
          </Button>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Password Reset Successful
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your password has been reset successfully. Redirecting to login...
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your new password below.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 1 }}
          />

          <PasswordStrengthIndicator
            password={password}
            username={userEmail.split("@")[0]}
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3, mt: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default ResetPassword;
