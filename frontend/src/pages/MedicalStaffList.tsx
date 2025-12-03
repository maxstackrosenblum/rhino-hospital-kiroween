import {
  Add as AddIcon,
  Delete as DeleteIcon,
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
import { useDeleteMedicalStaff, useMedicalStaff } from '../api/staff';
import { MedicalStaff } from '../types';

/**
 * MedicalStaffList page component
 * Displays a table of medical staff with search and delete functionality
 */
function MedicalStaffList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, error } = useMedicalStaff(searchQuery);
  const deleteMutation = useDeleteMedicalStaff();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<MedicalStaff | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const handleDeleteClick = (staff: MedicalStaff) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
    setSuccessMessage(null);
    setOperationError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      setOperationError(null);
      await deleteMutation.mutateAsync(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
      setSuccessMessage('Medical staff deleted successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setOperationError('Failed to delete medical staff. Please try again.');
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const staff = data?.items || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3" component="h1" fontWeight={700}>
            Medical Staff Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/medical-staff/add')}
          >
            Add Medical Staff
          </Button>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {(error || operationError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {operationError || 'Failed to load medical staff'}
          </Alert>
        )}

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

        {isLoading && (
          <LoadingSpinner message="Loading medical staff..." />
        )}

        {!isLoading && (
          <>
            {staff.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'No Results Found' : 'No Medical Staff Yet'}
                description={
                  searchQuery
                    ? 'No medical staff match your search criteria. Try adjusting your search terms.'
                    : 'Get started by adding your first medical staff member to the system.'
                }
                actionLabel={!searchQuery ? 'Add Medical Staff' : undefined}
                onAction={!searchQuery ? () => navigate('/medical-staff/add') : undefined}
              />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>First Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Job Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id} hover>
                        <TableCell>{member.first_name || '-'}</TableCell>
                        <TableCell>{member.last_name || '-'}</TableCell>
                        <TableCell>{member.email || '-'}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>{member.job_title || '-'}</TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeleteClick(member)}
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-staff-dialog-title"
        >
          <DialogTitle id="delete-staff-dialog-title">
            Delete Medical Staff?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete{' '}
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

export default MedicalStaffList;
