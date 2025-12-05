import {
  Alert,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordStrengthIndicator from "../components/users/PasswordStrengthIndicator";
import { useChangePassword } from "../api/auth";

interface ChangePasswordProps {
  onPasswordChanged: () => void;
  user?: any;
}

function ChangePassword({ onPasswordChanged, user }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [errorList, setErrorList] = useState<string[]>([]);
  const navigate = useNavigate();
  
  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorList([]);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Password changed successfully - trigger logout and re-login
      onPasswordChanged();
    } catch (err: any) {
      // Handle structured error response from password policy
      if (err.message && err.message.includes("{")) {
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.detail && typeof errorData.detail === "object") {
            if (errorData.detail.errors && Array.isArray(errorData.detail.errors)) {
              setError(errorData.detail.message || "Validation error");
              setErrorList(errorData.detail.errors);
            } else if (errorData.detail.message) {
              setError(errorData.detail.message);
            } else {
              setError(JSON.stringify(errorData.detail));
            }
          } else {
            setError(errorData.detail || err.message);
          }
        } catch {
          setError(err.message || "An error occurred");
        }
      } else {
        setError(err.message || "An error occurred");
      }
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
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img
              src="/logo-full.png"
              alt="Hospital Logo"
              style={{
                height: "80px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography variant="h4" gutterBottom align="center" fontWeight={700}>
            Password Change Required
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
            For security reasons, you must change your temporary password before accessing the system.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
              {errorList.length > 0 && (
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {errorList.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              size="small"
            />

            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 1 }}
              size="small"
            />

            {newPassword && (
              <PasswordStrengthIndicator
                password={newPassword}
                username={user?.username || ""}
              />
            )}

            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3, mt: 2 }}
              size="small"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={changePasswordMutation.isPending}
              sx={{ mb: 2 }}
            >
              {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center">
            After changing your password, you will be logged out and need to log in again with your new password.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default ChangePassword;