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
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateCurrentUser } from "../api";

function Profile({ user }: any) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    password: "",
    role: user.role,
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

            {updateProfileMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {updateProfileMutation.error.message}
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
