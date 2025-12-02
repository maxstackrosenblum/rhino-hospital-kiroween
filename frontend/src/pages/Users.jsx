import { Cancel as CancelIcon, Clear as ClearIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteUser, useUpdateUser, useUsers } from "../api";

function Users({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchInputRef = useRef(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading, error: queryError } = useUsers(page, pageSize, search, roleFilter);
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = data?.users || [];
  const totalPages = data?.total_pages || 0;

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    // Only admins can access this page
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
    
    // Auto-focus search input on page load
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [user, navigate]);



  const handleEdit = (u) => {
    setEditingUser(u.id);
    setEditForm({
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
    });
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({ email: "", first_name: "", last_name: "", role: "" });
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (userId) => {
    updateUserMutation.mutate(
      { userId, data: editForm },
      {
        onSuccess: () => {
          setEditingUser(null);
          setTimeout(() => {
            updateUserMutation.reset();
          }, 3000);
        },
      }
    );
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

  const handleDeleteClick = (u) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    deleteUserMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        setTimeout(() => {
          deleteUserMutation.reset();
        }, 3000);
      },
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          fontWeight={700}
          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
        >
          User Management
        </Typography>

        {/* Search and Filter */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          mb: 3, 
          mt: 3 
        }}>
          <TextField
            inputRef={searchInputRef}
            placeholder="Search by name, username, or email..."
            value={searchInput}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {searchInput && (
                      <IconButton
                        onClick={handleClearSearch}
                        size="small"
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Button
                      color="primary"
                      onClick={handleSearchSubmit}
                      size="small"
                    >
                      Search
                    </Button>
                  </Box>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              displayEmpty
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="receptionist">Receptionist</MenuItem>
              <MenuItem value="undefined">Undefined</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {(queryError || updateUserMutation.error || deleteUserMutation.error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {queryError?.message || updateUserMutation.error?.message || deleteUserMutation.error?.message}
          </Alert>
        )}

        {(updateUserMutation.isSuccess || deleteUserMutation.isSuccess) && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {updateUserMutation.isSuccess && "User updated successfully!"}
            {deleteUserMutation.isSuccess && "User deleted successfully!"}
          </Alert>
        )}

        {/* Mobile Card View */}
        {isMobile ? (
          <Stack spacing={2} sx={{ mt: 3 }}>
            {users.map((u) => (
              <Card key={u.id} elevation={2}>
                <CardContent>
                  {editingUser === u.id ? (
                    <Stack spacing={2}>
                      <TextField
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleChange}
                        placeholder="First Name"
                        size="small"
                        label="First Name"
                        fullWidth
                      />
                      <TextField
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleChange}
                        placeholder="Last Name"
                        size="small"
                        label="Last Name"
                        fullWidth
                      />
                      <TextField
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleChange}
                        size="small"
                        label="Email"
                        fullWidth
                      />
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
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          onClick={() => handleSave(u.id)}
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<SaveIcon />}
                          fullWidth
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<CancelIcon />}
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {u.first_name} {u.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{u.username}
                          </Typography>
                        </Box>
                        <Chip
                          label={u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          color={getRoleChipColor(u.role)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Email:</strong> {u.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>Joined:</strong> {new Date(u.created_at).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          onClick={() => handleEdit(u)}
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<EditIcon />}
                          sx={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(u)}
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          sx={{ flex: 1 }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          /* Desktop Table View */
          <TableContainer component={Paper} sx={{ mt: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 750 }}>
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
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              onClick={() => handleEdit(u)}
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<EditIcon />}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(u)}
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(e, value) => setPage(value)}
              color="primary"
              size={isMobile ? 'small' : 'large'}
            />
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-user-dialog-title"
        >
          <DialogTitle id="delete-user-dialog-title">
            Delete User?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete user{' '}
              <Box component="strong" sx={{ color: 'text.primary' }}>
                {userToDelete?.username}
              </Box>
              ? This will soft delete the account and the user will no longer be able to log in.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained"
              sx={{
                color: '#ffffff',
                '&:hover': {
                  color: '#ffffff',
                }
              }}
            >
              Delete User
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default Users;
