import { Cancel as CancelIcon, Edit as EditIcon, Save as SaveIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Users({ user, token }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "",
  });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Only admins can access this page
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u.id);
    setEditForm({
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
    });
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({ email: "", first_name: "", last_name: "", role: "" });
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (userId) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
        setSuccess("User updated successfully!");
        setEditingUser(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || "Failed to update user");
      }
    } catch (err) {
      setError("Connection error");
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case "admin":
        return "secondary";
      case "doctor":
        return "success";
      case "receptionist":
        return "info";
      case "undefined":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          User Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  {editingUser === u.id ? (
                    <>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <TextField
                            name="first_name"
                            value={editForm.first_name}
                            onChange={handleChange}
                            placeholder="First Name"
                            size="small"
                            variant="outlined"
                          />
                          <TextField
                            name="last_name"
                            value={editForm.last_name}
                            onChange={handleChange}
                            placeholder="Last Name"
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>
                        <TextField
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleChange}
                          size="small"
                          variant="outlined"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            name="role"
                            value={editForm.role}
                            onChange={handleChange}
                          >
                            <MenuItem value="undefined">Undefined</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="doctor">Doctor</MenuItem>
                            <MenuItem value="receptionist">Receptionist</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            onClick={() => handleSave(u.id)}
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<SaveIcon />}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancel}
                            variant="outlined"
                            color="secondary"
                            size="small"
                            startIcon={<CancelIcon />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {u.first_name} {u.last_name}
                      </TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          color={getRoleChipColor(u.role)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleEdit(u)}
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default Users;
