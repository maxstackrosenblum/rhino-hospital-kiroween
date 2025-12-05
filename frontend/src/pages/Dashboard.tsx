import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { CalendarMonth as CalendarIcon, Favorite as FavoriteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function Dashboard({ user }: any) {
  const navigate = useNavigate();
  
  const getRoleChipColor = (role: any) => {
    switch (role) {
      case "admin":
        return "secondary";
      case "doctor":
        return "success";
      case "receptionist":
        return "info";
      case "accountant":
        return "warning"; // Orange color
      case "undefined":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight={700} textAlign="center">
        Welcome, {user.first_name} {user.last_name}!
      </Typography>
      {["undefined", "patient"].includes(user.role) && (
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Book an appointment or track your blood pressure
        </Typography>
      )}

      {/* User Info Card - Only for staff roles */}
      {!["undefined", "patient"].includes(user.role) && (
        <Card sx={{ mt: 3, maxWidth: 600, mx: "auto" }}>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body1">
                <strong>Username:</strong> {user.username}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {user.email}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1">
                  <strong>Role:</strong>
                </Typography>
                <Chip
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  color={getRoleChipColor(user.role)}
                  variant="filled"
                />
              </Box>
              <Typography variant="body1">
                <strong>Member since:</strong>{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Undefined/Patient Users */}
      {["undefined", "patient"].includes(user.role) && (
        <Box sx={{ mt: 4, maxWidth: 700, mx: "auto" }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={6}>
              <Card sx={{ height: "100%", cursor: "pointer", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }} onClick={() => navigate("/appointments")}>
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 2 }}>
                    <CalendarIcon sx={{ fontSize: 48, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                      Book Appointment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Schedule a consultation with our doctors
                    </Typography>
                    <Button variant="contained" fullWidth>
                      Go to Appointments
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ height: "100%", cursor: "pointer", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }} onClick={() => navigate("/blood-pressure")}>
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 2 }}>
                    <FavoriteIcon sx={{ fontSize: 48, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                      Blood Pressure Check
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track your blood pressure measurements
                    </Typography>
                    <Button variant="contained" fullWidth>
                      Go to Blood Pressure
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default Dashboard;
