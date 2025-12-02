import { Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
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
  useCompletePatientProfile,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from "../api/patients";
import CompletePatientProfileDialog from "../components/patients/CompletePatientProfileDialog";
import DeletePatientDialog from "../components/patients/DeletePatientDialog";
import EditPatientDialog from "../components/patients/EditPatientDialog";
import PatientsTable from "../components/patients/PatientsTable";
import { useDebounce } from "../hooks/useDebounce";
import { Patient, PatientProfileCreate, PatientUpdate, User } from "../types";

interface PatientsProps {
  user: User;
}

function Patients({ user }: PatientsProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [completeProfileDialogOpen, setCompleteProfileDialogOpen] =
    useState(false);
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
    data: patientsResponse,
    isLoading,
    error: queryError,
  } = usePatients({
    search: debouncedSearchTerm,
    page_size: 100,
  });

  const patients = patientsResponse?.patients || [];

  const createPatientProfileMutation = useCompletePatientProfile();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  // Handle success messages only - errors are handled in forms
  useEffect(() => {
    if (createPatientProfileMutation.isSuccess) {
      setSuccessMessage("Patient profile completed successfully!");
    }
  }, [createPatientProfileMutation.isSuccess]);

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
    if (!editingPatient || editingPatient.id === null) return;

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

  // Handlers for completing patient profile
  const handleCompleteProfile = (patient: Patient) => {
    setEditingPatient(patient);
    setCompleteProfileDialogOpen(true);
  };

  const handleCompleteProfileSubmit = (data: PatientProfileCreate) => {
    if (!editingPatient) return;

    createPatientProfileMutation.mutate(
      { profileData: data, userId: editingPatient.user_id },
      {
        onSuccess: () => {
          setCompleteProfileDialogOpen(false);
          setEditingPatient(null);
        },
      }
    );
  };

  const handleCompleteProfileCancel = () => {
    setCompleteProfileDialogOpen(false);
    setEditingPatient(null);
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
    if (!patientToDelete || patientToDelete.id === null) return;

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
          onCompleteProfile={handleCompleteProfile}
        />

        {/* Complete Patient Profile Dialog */}
        <CompletePatientProfileDialog
          open={completeProfileDialogOpen}
          isCompleting={createPatientProfileMutation.isPending}
          onClose={handleCompleteProfileCancel}
          onSubmit={handleCompleteProfileSubmit}
          submitError={createPatientProfileMutation.error?.message || null}
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
