import { Box, LinearProgress, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  username?: string;
}

interface Strength {
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  score: number;
}

const PasswordStrengthIndicator = ({ password, username = '' }: PasswordStrengthIndicatorProps) => {
  const [strength, setStrength] = useState<Strength>({ label: 'weak', score: 0 });
  const [requirements, setRequirements] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!password) {
      setStrength({ label: 'weak', score: 0 });
      setErrors([]);
      return;
    }

    // Calculate strength locally
    const localStrength = calculateStrength(password);
    setStrength(localStrength);

    // Validate against requirements
    const validationErrors = validatePassword(password, username);
    setErrors(validationErrors);
  }, [password, username]);

  useEffect(() => {
    // Fetch password requirements from backend
    fetch(`${import.meta.env.VITE_API_URL}/api/password-policy`)
      .then(res => res.json())
      .then(data => setRequirements(data.requirements))
      .catch(err => console.error('Failed to fetch password policy:', err));
  }, []);

  const calculateStrength = (pwd: string): Strength => {
    let score = 0;

    // Length
    if (pwd.length >= 12) score += 15;
    if (pwd.length >= 16) score += 10;
    if (pwd.length >= 20) score += 5;

    // Character variety
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/\d/.test(pwd)) score += 10;
    // Check for special characters
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (pwd.split('').some(char => specialChars.includes(char))) score += 10;

    // Complexity
    const uniqueChars = new Set(pwd).size;
    if (uniqueChars >= 8) score += 10;
    if (uniqueChars >= 12) score += 10;
    if (uniqueChars >= 16) score += 10;

    let label = 'weak';
    if (score >= 90) label = 'very_strong';
    else if (score >= 75) label = 'strong';
    else if (score >= 60) label = 'good';
    else if (score >= 40) label = 'fair';

    return { label, score };
  };

  const validatePassword = (pwd: string, user: string): string[] => {
    const errors = [];

    if (pwd.length < 12) {
      errors.push('At least 12 characters long');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('At least one uppercase letter (A-Z)');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('At least one lowercase letter (a-z)');
    }
    if (!/\d/.test(pwd)) {
      errors.push('At least one number (0-9)');
    }
    // Check for special characters - must match backend: !@#$%^&*()_+-=[]{}|;:,.<>?
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const hasSpecialChar = pwd.split('').some(char => specialChars.includes(char));
    if (!hasSpecialChar) {
      errors.push('At least one special character');
    }

    return errors;
  };

  const getStrengthColor = (): 'success' | 'warning' | 'error' => {
    switch (strength.label) {
      case 'very_strong': return 'success';
      case 'strong': return 'success';
      case 'good': return 'success';
      case 'fair': return 'warning';
      default: return 'error';
    }
  };

  const getStrengthLabel = (): string => {
    switch (strength.label) {
      case 'very_strong': return 'Very Strong';
      case 'strong': return 'Strong';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      default: return 'Weak';
    }
  };

  if (!password) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          Password Strength:
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={strength.score}
            color={getStrengthColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography
          variant="body2"
          fontWeight={600}
          color={`${getStrengthColor()}.main`}
          sx={{ minWidth: 80 }}
        >
          {getStrengthLabel()}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Password Requirements:
        </Typography>
        <List dense>
          {requirements.map((req, index) => {
            // Check if this requirement is met by seeing if it's NOT in the errors list
            const isMet = !errors.includes(req);
            return (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {isMet ? (
                    <CheckIcon fontSize="small" color="success" />
                  ) : (
                    <CloseIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={req}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: isMet ? 'success.main' : 'error.main',
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default PasswordStrengthIndicator;
