import {
  Alert,
  Box,
  Button,
  Container,
  FormHelperText,
  MenuItem,
  Paper,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateCurrentUser } from "../api";
import PasswordStrengthIndicator from "../components/users/PasswordStrengthIndicator";

function Profile({ user }: any) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    password: "",
    role: user.role,
  });
  const [emailPreferences, setEmailPreferences] = useState({
    appointment_updates: user.email_preferences?.appointment_updates ?? true,
    blood_pressure_alerts: user.email_preferences?.blood_pressure_alerts ?? true,
  });
  const updateProfileMutation = useUpdateCurrentUser();

  const handleProfileChange = (e: any) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: any) => {
    e.preventDefault();

    const updateData: any = {};
    if (profileData.email !== user.email) updateData.email = profileData.email;
    if (profileData.first_name !== user.first_name)
      updateData.first_name = profileData.first_name;
    if (profileData.last_name !== user.last_name)
      updateData.last_name = profileData.last_name;
    if (profileData.password) updateData.password = profileData.password;
    if (profileData.role !== user.role) updateData.role = profileData.role;
    
    // Check if email preferences changed
    const currentPrefs = user.email_preferences || {};
    if (
      emailPreferences.appointment_updates !== (currentPrefs.appointment_updates ?? true) ||
      emailPreferences.blood_pressure_alerts !== (currentPrefs.blood_pressure_alerts ?? true)
    ) {
      updateData.email_preferences = emailPreferences;
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    updateProfileMutation.mutate(updateData, {
      onSuccess: () => {
        setTimeout(() => {
          navigate("/");
        }, 1500);
      },
    });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Profile
          </Typography>

          <Box component="form" onSubmit={handleProfileSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              margin="normal"
              name="first_name"
              label="First Name"
              value={profileData.first_name}
              onChange={handleProfileChange}
              size="small"
              required
            />

            <TextField
              fullWidth
              margin="normal"
              name="last_name"
              label="Last Name"
              value={profileData.last_name}
              onChange={handleProfileChange}
              size="small"
              required
            />

            <TextField
              fullWidth
              margin="normal"
              name="email"
              label="Email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              size="small"
              required
            />

            <TextField
              fullWidth
              margin="normal"
              name="password"
              label="New Password"
              type="password"
              placeholder="Leave blank to keep current password"
              value={profileData.password}
              onChange={handleProfileChange}
              helperText="Leave blank to keep current password"
              size="small"
            />

            {profileData.password && (
              <Box sx={{ mt: 1 }}>
                <PasswordStrengthIndicator
                  password={profileData.password}
                  username={user.username}
                />
              </Box>
            )}

            <TextField
              fullWidth
              margin="normal"
              name="role"
              label="Role"
              select
              value={profileData.role}
              onChange={handleProfileChange}
              disabled={user.role !== "admin"}
              size="small"
            >
              <MenuItem value="undefined">Undefined</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="receptionist">Receptionist</MenuItem>
            </TextField>
            {user.role !== "admin" && (
              <FormHelperText>Only admins can change roles</FormHelperText>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Email Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose which email notifications you'd like to receive. Security-related emails (password reset, account changes) will always be sent.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emailPreferences.appointment_updates}
                    onChange={(e) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        appointment_updates: e.target.checked,
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Appointment Updates</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive confirmations and status changes for your appointments
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={emailPreferences.blood_pressure_alerts}
                    onChange={(e) =>
                      setEmailPreferences({
                        ...emailPreferences,
                        blood_pressure_alerts: e.target.checked,
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Blood Pressure Alerts</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get notified when your blood pressure readings are abnormal
                    </Typography>
                  </Box>
                }
              />

            </Box>

            {updateProfileMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {typeof updateProfileMutation.error === 'object' && 
                 (updateProfileMutation.error as any).response?.data?.detail ? (
                  <>
                    {typeof (updateProfileMutation.error as any).response.data.detail === 'object' ? (
                      <>
                        {(updateProfileMutation.error as any).response.data.detail.message}
                        {(updateProfileMutation.error as any).response.data.detail.errors && (
                          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                            {(updateProfileMutation.error as any).response.data.detail.errors.map((err: string, index: number) => (
                              <li key={index}>{err}</li>
                            ))}
                          </Box>
                        )}
                      </>
                    ) : (
                      (updateProfileMutation.error as any).response.data.detail
                    )}
                  </>
                ) : (
                  (updateProfileMutation.error as any).message || 'An error occurred'
                )}
              </Alert>
            )}
            {updateProfileMutation.isSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Profile updated successfully!
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Profile;
