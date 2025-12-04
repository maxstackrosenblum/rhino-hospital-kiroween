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
  Pagination,
  Select,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCompleteDoctorProfile,
  useDeleteDoctor,
  useDoctors,
  useUpdateDoctor,
} from "../api/doctors";
import {
  CompleteDoctorProfileDialog,
  DeleteDoctorDialog,
  DoctorsStack,
  DoctorsTable,
  EditDoctorDialog,
} from "../components/doctors";
import { useDebounce } from "../hooks/useDebounce";
import { Doctor, DoctorProfileCreate, DoctorUpdate, User } from "../types";

interface DoctorsProps {
  user: User;
}

function Doctors({ user }: DoctorsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2);
  const [completeProfileDialogOpen, setCompleteProfileDialogOpen] =
    useState(false);
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

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // API hooks
  const {
    data: doctorsResponse,
    isLoading,
    error: queryError,
  } = useDoctors({
    search: debouncedSearchTerm,
    page: page,
    page_size: pageSize,
  });

  const doctors = doctorsResponse?.doctors || [];
  const totalPages = doctorsResponse?.total_pages || 0;
  const totalRecords = doctorsResponse?.total || 0;

  const completeDoctorProfileMutation = useCompleteDoctorProfile();
  const updateDoctorMutation = useUpdateDoctor();
  const deleteDoctorMutation = useDeleteDoctor();

  // Handle success messages only - errors are handled in forms
  useEffect(() => {
    if (completeDoctorProfileMutation.isSuccess) {
      setSuccessMessage("Doctor profile completed successfully!");
    }
  }, [completeDoctorProfileMutation.isSuccess]);

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
    if (!editingDoctor || editingDoctor.id === null) return;

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

  // Handlers for completing doctor profile
  const handleCompleteProfile = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setCompleteProfileDialogOpen(true);
  };

  const handleCompleteProfileSubmit = (data: DoctorProfileCreate) => {
    if (!editingDoctor) return;

    completeDoctorProfileMutation.mutate(
      { profileData: data, userId: editingDoctor.user_id },
      {
        onSuccess: () => {
          setCompleteProfileDialogOpen(false);
          setEditingDoctor(null);
        },
      }
    );
  };

  const handleCompleteProfileCancel = () => {
    setCompleteProfileDialogOpen(false);
    setEditingDoctor(null);
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
    if (!doctorToDelete || doctorToDelete.id === null) return;

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
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
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

        {/* Only show query errors (loading data errors) above the table */}
        {queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load doctors: {queryError.message}
          </Alert>
        )}

        {/* Doctors Display - Table for desktop, Stack for mobile */}
        {isMobile ? (
          <DoctorsStack
            doctors={doctors}
            searchTerm={debouncedSearchTerm}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onCompleteProfile={handleCompleteProfile}
          />
        ) : (
          <DoctorsTable
            doctors={doctors}
            searchTerm={debouncedSearchTerm}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onCompleteProfile={handleCompleteProfile}
          />
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box sx={{ mt: 3 }}>
            {/* Info and Per Page Controls */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: { xs: 2, md: 0 },
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {doctors.length} of {totalRecords} doctors
              </Typography>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per page</InputLabel>
                <Select
                  value={pageSize}
                  label="Per page"
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Pagination Controls */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: { xs: 0, md: 2 },
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          </Box>
        )}

        {/* Complete Doctor Profile Dialog */}
        <CompleteDoctorProfileDialog
          open={completeProfileDialogOpen}
          isCompleting={completeDoctorProfileMutation.isPending}
          onClose={handleCompleteProfileCancel}
          onSubmit={handleCompleteProfileSubmit}
          submitError={completeDoctorProfileMutation.error?.message || null}
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
