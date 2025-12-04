import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { User } from "../../types";

interface UsersStackProps {
  users: User[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

function UsersStack({
  users,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
}: UsersStackProps) {
  const getRoleChipColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "doctor":
        return "success";
      case "medical_staff":
        return "info";
      case "receptionist":
        return "info";
      case "patient":
        return "primary";
      case "accountant":
        return "warning";
      case "undefined":
        return "default";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 4,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading users...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              py: 4,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? "No users found" : "No users created"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No users match "${searchTerm}". Try searching by name, username, or email.`
                : "Get started by creating your first user account."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {users.map((user) => (
        <Card key={user.id} elevation={2}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    {user.first_name} {user.last_name}
                  </Typography>
                  <Chip
                    label={
                      user.role === "medical_staff"
                        ? "Medical Staff"
                        : user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    }
                    color={getRoleChipColor(user.role)}
                    variant="filled"
                    size="small"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Username:</strong> {user.username}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Email:</strong> {user.email}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Phone:</strong> {user.phone}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>City:</strong> {user.city}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Joined:</strong>{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <IconButton
                  onClick={() => onEdit(user)}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(user)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default UsersStack;
