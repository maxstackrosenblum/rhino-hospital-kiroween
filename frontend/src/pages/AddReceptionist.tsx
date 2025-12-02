import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../api';
import { useCreateReceptionist } from '../api/staff';

/**
 * AddReceptionist page component
 * Creates a user account and then creates a receptionist record linked to that user
 */
function AddReceptionist() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const registerMutation = useRegister();
  const createReceptionistMutation = useCreateReceptionist();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    shift_schedule: '',
    desk_number: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setErrors({});

    try {
      // Step 1: Create user account with role 'receptionist'
      const userResponse = await registerMutation.mutateAsync({
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        password: formData.password,
      });

      // Step 2: Create receptionist record linked to the user
      await createReceptionistMutation.mutateAsync({
        user_id: userResponse.id,
        shift_schedule: formData.shift_schedule || undefined,
        desk_number: formData.desk_number || undefined,
      });

      setSuccessMessage('Receptionist registered successfully!');
      
      // Redirect to receptionist list after a short delay
      setTimeout(() => {
        navigate('/receptionists');
      }, 1500);
    } catch (error: any) {
      console.error('Error registering receptionist:', error);
      setErrorMessage(error.message || 'Failed to register receptionist. Please check the form and try again.');
    }
  };

  const isSubmitting = registerMutation.isPending || createReceptionistMutation.isPending;

  // Check if form is valid (all required fields have values)
  const isFormValid = 
    formData.email.trim() !== '' &&
    formData.username.trim() !== '' &&
    formData.first_name.trim() !== '' &&
    formData.last_name.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.password.trim() !== '';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
        Add New Receptionist
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ p: 4, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Account Information
            </Typography>

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Receptionist Information (Optional)
            </Typography>

            <TextField
              label="Shift Schedule"
              name="shift_schedule"
              value={formData.shift_schedule}
              onChange={(e) => handleChange('shift_schedule', e.target.value)}
              fullWidth
              disabled={isSubmitting}
              placeholder="e.g., Monday-Friday 9AM-5PM"
            />

            <TextField
              label="Desk Number"
              name="desk_number"
              value={formData.desk_number}
              onChange={(e) => handleChange('desk_number', e.target.value)}
              fullWidth
              disabled={isSubmitting}
              placeholder="e.g., Desk 5"
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!isFormValid || isSubmitting}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {isSubmitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Registering...</span>
                  </Box>
                ) : (
                  'Register Receptionist'
                )}
              </Button>

              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/receptionists')}
                disabled={isSubmitting}
                sx={{ py: 1.5, minWidth: 120 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default AddReceptionist;
