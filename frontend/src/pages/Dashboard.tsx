import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from "@mui/material";

function Dashboard({ user }: any) {
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
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <img
          src="/logo-full.png"
          alt="Hospital Logo"
          style={{
            height: "150px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Box>
      <Typography variant="h3" component="h1" gutterBottom fontWeight={700} textAlign="center">
        Welcome, {user.first_name} {user.last_name}!
      </Typography>

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
    </Container>
  );
}

export default Dashboard;
