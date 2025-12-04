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
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateMedicalStaff,
  useDeleteMedicalStaff,
  useMedicalStaff,
  useUpdateMedicalStaff,
} from "../api/staff";
import {
  CompleteMedicalStaffProfileDialog,
  DeleteMedicalStaffDialog,
  EditMedicalStaffDialog,
  MedicalStaffStack,
  MedicalStaffTable,
} from "../components/medical-staff";
import { useDebounce } from "../hooks/useDebounce";
import {
  MedicalStaff,
  MedicalStaffCreate,
  MedicalStaffUpdate,
  User,
} from "../types";

interface MedicalStaffListProps {
  user: User;
}

function MedicalStaffList({ user }: MedicalStaffListProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [completeProfileDialogOpen, setCompleteProfileDialogOpen] =
    useState(false);
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

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // API hooks
  const {
    data: staffResponse,
    isLoading,
    error: queryError,
  } = useMedicalStaff(page, pageSize, debouncedSearchTerm);

  const medicalStaff = staffResponse?.items || [];
  const totalPages = staffResponse?.total_pages || 0;
  const totalRecords = staffResponse?.total || 0;

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

        {/* Query errors */}
        {queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load medical staff: {queryError.message}
          </Alert>
        )}

        {/* Medical Staff Display - Table for desktop, Stack for mobile */}
        {isMobile ? (
          <MedicalStaffStack
            medicalStaff={medicalStaff}
            searchTerm={debouncedSearchTerm}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onCompleteProfile={handleCompleteProfile}
          />
        ) : (
          <MedicalStaffTable
            medicalStaff={medicalStaff}
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
                Showing {medicalStaff.length} of {totalRecords} medical staff
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

export default MedicalStaffList;
