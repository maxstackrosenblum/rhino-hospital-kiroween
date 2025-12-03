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
import { useCreateMedicalStaff } from '../api/staff';

/**
 * AddMedicalStaff page component
 * Creates a user account and then creates a medical staff record linked to that user
 */
function AddMedicalStaff() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const registerMutation = useRegister();
  const createMedicalStaffMutation = useCreateMedicalStaff();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    job_title: '',
    department: '',
    shift_schedule: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      // Step 1: Create user account with role 'medical_staff'
      const userResponse = await registerMutation.mutateAsync({
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        password: formData.password,
        role: 'medical_staff' as any,
      });

      // Step 2: Create medical staff record linked to the user
      await createMedicalStaffMutation.mutateAsync({
        user_id: userResponse.id,
        job_title: formData.job_title || undefined,
        department: formData.department || undefined,
        shift_schedule: formData.shift_schedule || undefined,
      });

      setSuccessMessage('Medical staff registered successfully!');
      
      setTimeout(() => {
        navigate('/medical-staff');
      }, 1500);
    } catch (error: any) {
      console.error('Error registering medical staff:', error);
      setErrorMessage(error.message || 'Failed to register medical staff. Please check the form and try again.');
    }
  };

  const isSubmitting = registerMutation.isPending || createMedicalStaffMutation.isPending;

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
        Add New Medical Staff
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
              Medical Staff Information (Optional)
            </Typography>

            <TextField
              label="Job Title"
              name="job_title"
              value={formData.job_title}
              onChange={(e) => handleChange('job_title', e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Department"
              name="department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Shift Schedule"
              name="shift_schedule"
              value={formData.shift_schedule}
              onChange={(e) => handleChange('shift_schedule', e.target.value)}
              fullWidth
              disabled={isSubmitting}
              placeholder="e.g., Monday-Friday 9AM-5PM"
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
                  'Register Medical Staff'
                )}
              </Button>

              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/medical-staff')}
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

export default AddMedicalStaff;
