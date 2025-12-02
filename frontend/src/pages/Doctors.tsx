import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateDoctor,
  useDeleteDoctor,
  useDoctors,
  useUpdateDoctor,
} from "../api/doctors";
import CreateDoctorDialog from "../components/doctors/CreateDoctorDialog";
import DeleteDoctorDialog from "../components/doctors/DeleteDoctorDialog";
import DoctorsTable from "../components/doctors/DoctorsTable";
import EditDoctorDialog from "../components/doctors/EditDoctorDialog";
import { useDebounce } from "../hooks/useDebounce";
import { Doctor, DoctorCreate, DoctorUpdate, User } from "../types";

interface DoctorsProps {
  user: User;
}

function Doctors({ user }: DoctorsProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Check user permissions - only admins can access doctor management
  useEffect(() => {
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // API hooks
  const {
    data: doctors = [],
    isLoading,
    error: queryError,
  } = useDoctors({
    search: debouncedSearchTerm,
    limit: 100,
  });

  const createDoctorMutation = useCreateDoctor();
  const updateDoctorMutation = useUpdateDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  // Handle success messages only - errors are handled in forms
  useEffect(() => {
    if (createDoctorMutation.isSuccess) {
      setSuccessMessage("Doctor created successfully!");
    }
  }, [createDoctorMutation.isSuccess]);

  useEffect(() => {
    if (updateDoctorMutation.isSuccess) {
      setSuccessMessage("Doctor updated successfully!");
    }
  }, [updateDoctorMutation.isSuccess]);

  useEffect(() => {
    if (deleteDoctorMutation.isSuccess) {
      setSuccessMessage("Doctor deleted successfully!");
    }
  }, [deleteDoctorMutation.isSuccess]);

  // Handlers for editing
  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (data: DoctorUpdate) => {
    if (!editingDoctor) return;

    updateDoctorMutation.mutate(
      { doctorId: editingDoctor.id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingDoctor(null);
        },
      }
    );
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingDoctor(null);
  };

  // Handlers for creating
  const handleCreateSubmit = (data: DoctorCreate) => {
    createDoctorMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  const handleCreateCancel = () => {
    setCreateDialogOpen(false);
  };

  // Handlers for deleting
  const handleDeleteClick = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDoctorToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!doctorToDelete) return;

    deleteDoctorMutation.mutate(doctorToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDoctorToDelete(null);
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
            Doctor Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Doctor
          </Button>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search doctors by name, email, or doctor ID..."
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
          {isLoading && searchTerm !== debouncedSearchTerm && (
            <CircularProgress size={20} />
          )}
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Alert>
        )}

        {/* Only show query errors (loading data errors) above the table */}
        {queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load doctors: {queryError.message}
          </Alert>
        )}

        {/* Doctors Table */}
        <DoctorsTable
          doctors={doctors}
          searchTerm={debouncedSearchTerm}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        {/* Create Doctor Dialog */}
        <CreateDoctorDialog
          open={createDialogOpen}
          isCreating={createDoctorMutation.isPending}
          onClose={handleCreateCancel}
          onSubmit={handleCreateSubmit}
          submitError={createDoctorMutation.error?.message || null}
        />

        {/* Edit Doctor Dialog */}
        <EditDoctorDialog
          open={editDialogOpen}
          doctor={editingDoctor}
          isUpdating={updateDoctorMutation.isPending}
          onClose={handleEditCancel}
          onSubmit={handleEditSubmit}
          submitError={updateDoctorMutation.error?.message || null}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteDoctorDialog
          open={deleteDialogOpen}
          doctor={doctorToDelete}
          isDeleting={deleteDoctorMutation.isPending}
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

export default Doctors;
