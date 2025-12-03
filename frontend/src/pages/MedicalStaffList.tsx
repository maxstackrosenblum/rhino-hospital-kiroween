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
  useCreateMedicalStaff,
  useDeleteMedicalStaff,
  useMedicalStaff,
  useUpdateMedicalStaff,
} from "../api/staff";
import CompleteMedicalStaffProfileDialog from "../components/medical-staff/CompleteMedicalStaffProfileDialog";
import DeleteMedicalStaffDialog from "../components/medical-staff/DeleteMedicalStaffDialog";
import EditMedicalStaffDialog from "../components/medical-staff/EditMedicalStaffDialog";
import MedicalStaffTable from "../components/medical-staff/MedicalStaffTable";
import { useDebounce } from "../hooks/useDebounce";
import { MedicalStaff, MedicalStaffCreate, MedicalStaffUpdate, User } from "../types";

interface MedicalStaffListProps {
  user: User;
}

function MedicalStaffList({ user }: MedicalStaffListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [completeProfileDialogOpen, setCompleteProfileDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<MedicalStaff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<MedicalStaff | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Check user permissions - only admins can access medical staff management
  useEffect(() => {
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // API hooks
  const {
    data: staffResponse,
    isLoading,
    error: queryError,
  } = useMedicalStaff(debouncedSearchTerm);

  const medicalStaff = staffResponse?.items || [];

  const createMedicalStaffMutation = useCreateMedicalStaff();
  const updateMedicalStaffMutation = useUpdateMedicalStaff();
  const deleteMedicalStaffMutation = useDeleteMedicalStaff();

  // Handle success messages
  useEffect(() => {
    if (createMedicalStaffMutation.isSuccess) {
      setSuccessMessage("Medical staff profile completed successfully!");
    }
  }, [createMedicalStaffMutation.isSuccess]);

  useEffect(() => {
    if (updateMedicalStaffMutation.isSuccess) {
      setSuccessMessage("Medical staff updated successfully!");
    }
  }, [updateMedicalStaffMutation.isSuccess]);

  useEffect(() => {
    if (deleteMedicalStaffMutation.isSuccess) {
      setSuccessMessage("Medical staff deleted successfully!");
    }
  }, [deleteMedicalStaffMutation.isSuccess]);

  // Handlers for editing
  const handleEdit = (staff: MedicalStaff) => {
    setEditingStaff(staff);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (data: MedicalStaffUpdate) => {
    if (!editingStaff || editingStaff.id === null) return;

    updateMedicalStaffMutation.mutate(
      { id: editingStaff.id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingStaff(null);
        },
      }
    );
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingStaff(null);
  };

  // Handlers for completing profile
  const handleCompleteProfile = (staff: MedicalStaff) => {
    setEditingStaff(staff);
    setCompleteProfileDialogOpen(true);
  };

  const handleCompleteProfileSubmit = (data: MedicalStaffCreate) => {
    if (!editingStaff) return;

    createMedicalStaffMutation.mutate(data, {
      onSuccess: () => {
        setCompleteProfileDialogOpen(false);
        setEditingStaff(null);
      },
    });
  };

  const handleCompleteProfileCancel = () => {
    setCompleteProfileDialogOpen(false);
    setEditingStaff(null);
  };

  // Handlers for deleting
  const handleDeleteClick = (staff: MedicalStaff) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!staffToDelete || staffToDelete.id === null) return;

    deleteMedicalStaffMutation.mutate(staffToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setStaffToDelete(null);
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
            Medical Staff Management
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search medical staff by name or email..."
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

        {/* Query errors */}
        {queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load medical staff: {queryError.message}
          </Alert>
        )}

        {/* Medical Staff Table */}
        <MedicalStaffTable
          medicalStaff={medicalStaff}
          searchTerm={debouncedSearchTerm}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onCompleteProfile={handleCompleteProfile}
        />

        {/* Complete Profile Dialog */}
        <CompleteMedicalStaffProfileDialog
          open={completeProfileDialogOpen}
          medicalStaff={editingStaff}
          isCompleting={createMedicalStaffMutation.isPending}
          onClose={handleCompleteProfileCancel}
          onSubmit={handleCompleteProfileSubmit}
          submitError={createMedicalStaffMutation.error?.message || null}
        />

        {/* Edit Dialog */}
        <EditMedicalStaffDialog
          open={editDialogOpen}
          medicalStaff={editingStaff}
          isUpdating={updateMedicalStaffMutation.isPending}
          onClose={handleEditCancel}
          onSubmit={handleEditSubmit}
          submitError={updateMedicalStaffMutation.error?.message || null}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteMedicalStaffDialog
          open={deleteDialogOpen}
          medicalStaff={staffToDelete}
          isDeleting={deleteMedicalStaffMutation.isPending}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />

        {/* Auto-dismissing Snackbar */}
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

export default MedicalStaffList;
