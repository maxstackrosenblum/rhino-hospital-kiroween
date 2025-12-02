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
import { useStaffForm } from '../hooks/useStaffForm';

/**
 * AddWorker page component
 * Provides a form for registering new hospital workers with validation and error handling
 * 
 * Requirements: 6.1, 6.2, 6.3, 7.1, 8.1, 8.2, 9.1
 */
function AddWorker() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSuccess = () => {
    setSuccessMessage('Worker registered successfully!');
    setErrorMessage(null);
    
    // Redirect to worker list after a short delay
    setTimeout(() => {
      navigate('/workers');
    }, 1500);
  };

  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useStaffForm('workers', onSuccess);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await handleSubmit();
    } catch (error) {
      // Error is already handled in the hook, but we can display a general message
      setErrorMessage('Failed to register worker. Please check the form and try again.');
    }
  };

  // Check if form is valid (all required fields have values)
  const isFormValid = 
    formData.first_name.trim() !== '' &&
    formData.last_name.trim() !== '' &&
    formData.phone.trim() !== '';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
        Add New Worker
      </Typography>

      {/* Success notification */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Error notification */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* General error from form hook */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <Paper sx={{ p: 4, mt: 3 }}>
        <form onSubmit={handleFormSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* First Name Field */}
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
              placeholder="Enter first name"
            />

            {/* Last Name Field */}
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
              placeholder="Enter last name"
            />

            {/* Phone Field */}
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
              placeholder="Enter phone number"
            />

            {/* Submit Button */}
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
                  'Register Worker'
                )}
              </Button>

              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/workers')}
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

export default AddWorker;
