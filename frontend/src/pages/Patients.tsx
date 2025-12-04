import { Search as SearchIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
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
  useCompletePatientProfile,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from "../api/patients";
import {
  AddNonPatientDialog,
  CompletePatientProfileDialog,
  DeletePatientDialog,
  EditPatientDialog,
  PatientsStack,
  PatientsTable,
} from "../components/patients";
import { PaginationControls } from "../components/common";
import { useDebounce } from "../hooks/useDebounce";
import { Patient, PatientProfileCreate, PatientUpdate, User } from "../types";

interface PatientsProps {
  user: User;
}

function Patients({ user }: PatientsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "hospitalized" | "my-patients"
  >(user.role === "doctor" ? "my-patients" : "hospitalized");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [completeProfileDialogOpen, setCompleteProfileDialogOpen] =
    useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [addNonPatientDialogOpen, setAddNonPatientDialogOpen] = useState(false);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filterStatus]);

  // API hooks
  const {
    data: patientsResponse,
    isLoading,
    error: queryError,
  } = usePatients({
    search: debouncedSearchTerm,
    page: page,
    page_size: pageSize,
    hospitalizationStatus: filterStatus === "all" ? undefined : filterStatus,
  });

  // Get pagination info and patients (filtered on backend)
  const patients = patientsResponse?.patients || [];
  const totalPages = patientsResponse?.total_pages || 0;
  const totalRecords = patientsResponse?.total || 0;

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
          {canModify && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddNonPatientDialogOpen(true)}
            >
              Add User as Patient
            </Button>
          )}
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
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "hospitalized" | "my-patients"
                )
              }
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

        {/* Patients Display - Table for desktop, Stack for mobile */}
        {isMobile ? (
          <PatientsStack
            patients={patients}
            searchTerm={debouncedSearchTerm}
            canModify={canModify}
            canDelete={canDelete}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onCompleteProfile={handleCompleteProfile}
          />
        ) : (
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
        )}

        {/* Pagination Controls */}
        <PaginationControls
          totalPages={totalPages}
          currentPage={page}
          pageSize={pageSize}
          totalRecords={totalRecords}
          currentRecords={patients.length}
          itemName="patients"
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
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

        {/* Add Non-Patient User Dialog */}
        <AddNonPatientDialog
          open={addNonPatientDialogOpen}
          onClose={() => setAddNonPatientDialogOpen(false)}
          onSuccess={() => setSuccessMessage("User converted to patient successfully!")}
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
