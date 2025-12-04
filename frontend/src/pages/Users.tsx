import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "../api/users";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
  UsersStack,
  UsersTable,
} from "../components/users";
import { PaginationControls } from "../components/common";
import { useDebounce } from "../hooks/useDebounce";
import { AdminUserUpdate, User, UserCreate } from "../types";

interface UsersProps {
  user: User;
}

function Users({ user }: UsersProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Check user permissions - only admins can access user management
  useEffect(() => {
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, roleFilter]);

  // API hooks
  const {
    data: usersResponse,
    isLoading,
    error: queryError,
  } = useUsers(page, pageSize, debouncedSearchTerm, roleFilter);

  const users = usersResponse?.users || [];
  const totalPages = usersResponse?.total_pages || 0;
  const totalRecords = usersResponse?.total || 0;

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Handle success messages only - errors are handled in forms
  useEffect(() => {
    if (createUserMutation.isSuccess) {
      setSuccessMessage("User created successfully!");
    }
  }, [createUserMutation.isSuccess]);

  useEffect(() => {
    if (updateUserMutation.isSuccess) {
      setSuccessMessage("User updated successfully!");
    }
  }, [updateUserMutation.isSuccess]);

  useEffect(() => {
    if (deleteUserMutation.isSuccess) {
      setSuccessMessage("User deleted successfully!");
    }
  }, [deleteUserMutation.isSuccess]);

  // Handlers for editing
  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (data: AdminUserUpdate) => {
    if (!editingUser) return;

    updateUserMutation.mutate(
      { userId: editingUser.id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingUser(null);
        },
      }
    );
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
  };

  // Handlers for creating users
  const handleCreateSubmit = (data: UserCreate) => {
    createUserMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  const handleCreateCancel = () => {
    setCreateDialogOpen(false);
  };

  // Handlers for deleting
  const handleDeleteClick = (userToDeleteParam: User) => {
    setUserToDelete(userToDeleteParam);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;

    deleteUserMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h3" component="h1" fontWeight={700}>
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add User
          </Button>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="medical_staff">Medical Staff</MenuItem>
              <MenuItem value="receptionist">Receptionist</MenuItem>
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="undefined">Undefined</MenuItem>
            </Select>
          </FormControl>
          {isLoading && searchTerm !== debouncedSearchTerm && (
            <CircularProgress size={20} />
          )}
        </Box>

        {/* Only show query errors (loading data errors) above the table */}
        {queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load users: {queryError.message}
          </Alert>
        )}

        {/* Users Display - Table for desktop, Stack for mobile */}
        {isMobile ? (
          <UsersStack
            users={users}
            searchTerm={debouncedSearchTerm}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        ) : (
          <UsersTable
            users={users}
            searchTerm={debouncedSearchTerm}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}

        {/* Pagination Controls */}
        <PaginationControls
          totalPages={totalPages}
          currentPage={page}
          pageSize={pageSize}
          totalRecords={totalRecords}
          currentRecords={users.length}
          itemName="users"
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
        />

        {/* Create User Dialog */}
        <CreateUserDialog
          open={createDialogOpen}
          isCreating={createUserMutation.isPending}
          onClose={handleCreateCancel}
          onSubmit={handleCreateSubmit}
          submitError={createUserMutation.error?.message || null}
        />

        {/* Edit User Dialog */}
        <EditUserDialog
          open={editDialogOpen}
          user={editingUser}
          isUpdating={updateUserMutation.isPending}
          onClose={handleEditCancel}
          onSubmit={handleEditSubmit}
          submitError={updateUserMutation.error?.message || null}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteUserDialog
          open={deleteDialogOpen}
          user={userToDelete}
          isDeleting={deleteUserMutation.isPending}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />

        {/* Auto-dismissing Snackbar for success messages */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSuccessMessage("")}
            severity="success"
            sx={{ width: "100%" }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default Users;
