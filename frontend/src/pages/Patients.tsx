import { Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCompletePatientProfile,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from "../api/patients";
import { useHospitalizations } from "../api/hospitalizations";
import { useDoctors } from "../api/doctors";
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
  const [filterStatus, setFilterStatus] = useState<"all" | "hospitalized" | "my-patients">(
    user.role === "doctor" ? "my-patients" : "hospitalized"
  );
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
    // Only doctors, medical staff, receptionists, and admins can access this page
    if (
      !["admin", "doctor", "medical_staff", "receptionist"].includes(user.role)
    ) {
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

  const { data: hospitalizations = [] } = useHospitalizations();
  const { data: doctorsResponse } = useDoctors({ page_size: 100 });
  const doctors = doctorsResponse?.doctors || [];

  // Find current user's doctor ID if they're a doctor
  const currentDoctor = doctors.find(d => d.user_id === user.id);

  // Get currently hospitalized patient IDs
  const hospitalizedPatientIds = new Set(
    hospitalizations
      .filter(h => !h.discharge_date) // Only active hospitalizations
      .map(h => h.patient_id)
  );

  // Get patient IDs for current doctor's hospitalizations
  const myPatientIds = new Set(
    currentDoctor
      ? hospitalizations
          .filter(h => 
            !h.discharge_date && // Only active hospitalizations
            h.doctors?.some(d => d.id === currentDoctor.id) // Doctor is assigned
          )
          .map(h => h.patient_id)
      : []
  );

  // Filter and sort patients
  const allPatients = patientsResponse?.patients || [];
  const filteredPatients = 
    filterStatus === "hospitalized"
      ? allPatients.filter(p => p.id && hospitalizedPatientIds.has(p.id))
      : filterStatus === "my-patients"
      ? allPatients.filter(p => p.id && myPatientIds.has(p.id))
      : allPatients;
  
  // Sort by created_at in reverse order (newest first)
  const patients = [...filteredPatients].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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

  // Check if user can modify patients (medical staff, receptionist, or admin)
  const canModify = ["admin", "medical_staff", "receptionist"].includes(
    user.role
  );
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

        {/* Search Bar and Filter */}
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
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterStatus}
              label="Filter"
              onChange={(e) => setFilterStatus(e.target.value as "all" | "hospitalized" | "my-patients")}
            >
              {user.role === "doctor" && (
                <MenuItem value="my-patients">My Patients</MenuItem>
              )}
              <MenuItem value="hospitalized">Currently Hospitalized</MenuItem>
              <MenuItem value="all">All Patients</MenuItem>
            </Select>
          </FormControl>
          {isLoading && searchTerm !== debouncedSearchTerm && (
            <CircularProgress size={20} />
          )}
        </Box>

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
