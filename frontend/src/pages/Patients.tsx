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
  useCreatePatient,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from "../api/patients";
import CreatePatientDialog from "../components/patients/CreatePatientDialog";
import DeletePatientDialog from "../components/patients/DeletePatientDialog";
import EditPatientDialog from "../components/patients/EditPatientDialog";
import PatientsTable from "../components/patients/PatientsTable";
import { useDebounce } from "../hooks/useDebounce";
import { Patient, PatientCreate, PatientUpdate, User } from "../types";

interface PatientsProps {
  user: User;
}

function Patients({ user }: PatientsProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Check user permissions
  useEffect(() => {
    // Only doctors, receptionists, and admins can access this page
    if (!["admin", "doctor", "receptionist"].includes(user.role)) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // API hooks
  const {
    data: patients = [],
    isLoading,
    error: queryError,
  } = usePatients({
    search: debouncedSearchTerm,
    limit: 100,
  });

  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  // Handle success messages only - errors are handled in forms
  useEffect(() => {
    if (createPatientMutation.isSuccess) {
      setSuccessMessage("Patient created successfully!");
    }
  }, [createPatientMutation.isSuccess]);

  useEffect(() => {
    if (updatePatientMutation.isSuccess) {
      setSuccessMessage("Patient updated successfully!");
    }
  }, [updatePatientMutation.isSuccess]);

  useEffect(() => {
    if (deletePatientMutation.isSuccess) {
      setSuccessMessage("Patient deleted successfully!");
    }
  }, [deletePatientMutation.isSuccess]);

  // Check if user can modify patients (receptionist or admin)
  const canModify = ["admin", "receptionist"].includes(user.role);
  const canDelete = user.role === "admin";

  // Handlers for editing
  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (data: PatientUpdate) => {
    if (!editingPatient) return;

    updatePatientMutation.mutate(
      { patientId: editingPatient.id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingPatient(null);
        },
      }
    );
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingPatient(null);
  };

  // Handlers for creating
  const handleCreateSubmit = (data: PatientCreate) => {
    createPatientMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  const handleCreateCancel = () => {
    setCreateDialogOpen(false);
  };

  // Handlers for deleting
  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!patientToDelete) return;

    deletePatientMutation.mutate(patientToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setPatientToDelete(null);
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
            Patient Management
          </Typography>
          {canModify && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Add Patient
            </Button>
          )}
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name, email, or phone..."
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
            Failed to load patients: {queryError.message}
          </Alert>
        )}

        {/* Patients Table */}
        <PatientsTable
          patients={patients}
          searchTerm={debouncedSearchTerm}
          canModify={canModify}
          canDelete={canDelete}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        {/* Create Patient Dialog */}
        <CreatePatientDialog
          open={createDialogOpen}
          isCreating={createPatientMutation.isPending}
          onClose={handleCreateCancel}
          onSubmit={handleCreateSubmit}
          submitError={createPatientMutation.error?.message || null}
        />

        {/* Edit Patient Dialog */}
        <EditPatientDialog
          open={editDialogOpen}
          patient={editingPatient}
          isUpdating={updatePatientMutation.isPending}
          onClose={handleEditCancel}
          onSubmit={handleEditSubmit}
          submitError={updatePatientMutation.error?.message || null}
        />

        {/* Delete Confirmation Dialog */}
        <DeletePatientDialog
          open={deleteDialogOpen}
          patient={patientToDelete}
          isDeleting={deletePatientMutation.isPending}
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

export default Patients;
