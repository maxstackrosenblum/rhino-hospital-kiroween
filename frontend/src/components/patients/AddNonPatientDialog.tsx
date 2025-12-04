import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { useState } from "react";
import { useNonPatientUsers, useConvertToPatient } from "../../api/patients";
import { PatientProfileCreate } from "../../types";
import { PaginationControls } from "../common";

interface AddNonPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddNonPatientDialog({
  open,
  onClose,
  onSuccess,
}: AddNonPatientDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState<PatientProfileCreate>({
    emergency_contact: "",
    insurance_info: "",
  });

  const { data: usersResponse, isLoading } = useNonPatientUsers({
    search: searchTerm,
    page,
    page_size: pageSize,
  });

  const convertMutation = useConvertToPatient();

  const users = usersResponse?.users || [];
  const totalPages = usersResponse?.total_pages || 0;
  const totalRecords = usersResponse?.total || 0;

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setShowProfileForm(true);
  };

  const handleSubmit = () => {
    if (!selectedUserId) return;

    convertMutation.mutate(
      { userId: selectedUserId, profileData },
      {
        onSuccess: () => {
          onSuccess();
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setSearchTerm("");
    setPage(1);
    setSelectedUserId(null);
    setShowProfileForm(false);
    setProfileData({ emergency_contact: "", insurance_info: "" });
    onClose();
  };

  const selectedUser = users.find((u: any) => u.id === selectedUserId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {showProfileForm ? "Complete Patient Profile" : "Add Existing User as Patient"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showProfileForm ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a user to convert to patient
            </Typography>

            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />

            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Alert severity="info">
                {searchTerm
                  ? "No users found matching your search"
                  : "No non-patient users available"}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow 
                          key={user.id} 
                          hover 
                          onClick={() => handleSelectUser(user.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <PaginationControls
                  totalPages={totalPages}
                  currentPage={page}
                  pageSize={pageSize}
                  totalRecords={totalRecords}
                  currentRecords={users.length}
                  itemName="users"
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                />
              </>
            )}
          </>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
            </Alert>

            <TextField
              fullWidth
              label="Emergency Contact"
              value={profileData.emergency_contact}
              onChange={(e) =>
                setProfileData({ ...profileData, emergency_contact: e.target.value })
              }
              placeholder="Name and phone number"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Insurance Information"
              value={profileData.insurance_info}
              onChange={(e) =>
                setProfileData({ ...profileData, insurance_info: e.target.value })
              }
              placeholder="Insurance provider and policy number"
              multiline
              rows={3}
            />

            {convertMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {convertMutation.error.message}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {showProfileForm && (
          <Button onClick={() => setShowProfileForm(false)} disabled={convertMutation.isPending}>
            Back
          </Button>
        )}
        <Button onClick={handleClose} disabled={convertMutation.isPending}>
          Cancel
        </Button>
        {showProfileForm && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={convertMutation.isPending}
            startIcon={convertMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {convertMutation.isPending ? "Saving..." : "Save Patient"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
