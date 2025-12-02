import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { useStaffList } from '../hooks/useStaffList';
import { Staff, StaffUpdate } from '../types';

/**
 * ReceptionistList page component
 * Displays a table of receptionists with search, edit, and delete functionality
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
function ReceptionistList() {
  const navigate = useNavigate();
  const {
    staff,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    deleteStaff,
    updateStaff,
  } = useStaffList('receptionists');

  const [editingStaff, setEditingStaff] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StaffUpdate>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Handle edit button click
  const handleEdit = (receptionist: Staff) => {
    setEditingStaff(receptionist.id);
    setEditForm({
      first_name: receptionist.first_name,
      last_name: receptionist.last_name,
      phone: receptionist.phone,
    });
    setSuccessMessage(null);
    setOperationError(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingStaff(null);
    setEditForm({});
  };

  // Handle edit form field change
  const handleEditChange = (field: keyof StaffUpdate, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save edit
  const handleSaveEdit = async (id: number) => {
    try {
      setOperationError(null);
      await updateStaff(id, editForm);
      setEditingStaff(null);
      setEditForm({});
      setSuccessMessage('Receptionist updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setOperationError('Failed to update receptionist. Please try again.');
    }
  };

  // Handle delete button click
  const handleDeleteClick = (receptionist: Staff) => {
    setStaffToDelete(receptionist);
    setDeleteDialogOpen(true);
    setSuccessMessage(null);
    setOperationError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      setOperationError(null);
      await deleteStaff(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
      setSuccessMessage('Receptionist deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setOperationError('Failed to delete receptionist. Please try again.');
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3" component="h1" fontWeight={700}>
            Receptionist Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/receptionists/add')}
          >
            Add Receptionist
          </Button>
        </Box>

        {/* Success message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error messages */}
        {(error || operationError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {operationError || error}
          </Alert>
        )}

        {/* Search input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by first name or last name..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Loading spinner */}
        {loading && (
          <LoadingSpinner message="Loading receptionists..." />
        )}

        {/* Table */}
        {!loading && (
          <>
            {staff.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'No Results Found' : 'No Receptionists Yet'}
                description={
                  searchQuery
                    ? 'No receptionists match your search criteria. Try adjusting your search terms.'
                    : 'Get started by adding your first receptionist to the system.'
                }
                actionLabel={!searchQuery ? 'Add Receptionist' : undefined}
                onAction={!searchQuery ? () => navigate('/receptionists/add') : undefined}
              />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>First Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Registered</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staff.map((receptionist) => (
                      <TableRow key={receptionist.id} hover>
                        {editingStaff === receptionist.id ? (
                          <>
                            {/* Edit mode */}
                            <TableCell>
                              <TextField
                                value={editForm.first_name || ''}
                                onChange={(e) => handleEditChange('first_name', e.target.value)}
                                size="small"
                                fullWidth
                                placeholder="First Name"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={editForm.last_name || ''}
                                onChange={(e) => handleEditChange('last_name', e.target.value)}
                                size="small"
                                fullWidth
                                placeholder="Last Name"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={editForm.phone || ''}
                                onChange={(e) => handleEditChange('phone', e.target.value)}
                                size="small"
                                fullWidth
                                placeholder="Phone"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(receptionist.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  onClick={() => handleSaveEdit(receptionist.id)}
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  startIcon={<SaveIcon />}
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outlined"
                                  color="secondary"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            {/* View mode */}
                            <TableCell>{receptionist.first_name}</TableCell>
                            <TableCell>{receptionist.last_name}</TableCell>
                            <TableCell>{receptionist.phone}</TableCell>
                            <TableCell>
                              {new Date(receptionist.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  onClick={() => handleEdit(receptionist)}
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  startIcon={<EditIcon />}
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteClick(receptionist)}
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-receptionist-dialog-title"
        >
          <DialogTitle id="delete-receptionist-dialog-title">
            Delete Receptionist?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete receptionist{' '}
              <Box component="strong" sx={{ color: 'text.primary' }}>
                {staffToDelete?.first_name} {staffToDelete?.last_name}
              </Box>
              ? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              sx={{
                color: '#ffffff',
                '&:hover': {
                  color: '#ffffff',
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default ReceptionistList;
