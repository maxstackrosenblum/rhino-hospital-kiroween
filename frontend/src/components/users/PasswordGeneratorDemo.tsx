/**
 * Demo component for testing password generation functionality
 * This can be used for development and testing purposes
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Slider,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { Refresh as RefreshIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { generatePassword, generatePasswordOptions, type PasswordGenerationOptions } from '../../utils/passwordGenerator';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const PasswordGeneratorDemo: React.FC = () => {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordGenerationOptions>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true
  });
  const [multipleOptions, setMultipleOptions] = useState<ReturnType<typeof generatePasswordOptions>>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGeneratePassword = () => {
    try {
      const result = generatePassword(options);
      setPassword(result.password);
      setMultipleOptions([]);
    } catch (error) {
      console.error('Password generation failed:', error);
    }
  };

  const handleGenerateMultiple = () => {
    try {
      const results = generatePasswordOptions(3, options);
      setMultipleOptions(results);
      setPassword('');
    } catch (error) {
      console.error('Multiple password generation failed:', error);
    }
  };

  const handleCopyPassword = async (passwordToCopy: string) => {
    try {
      await navigator.clipboard.writeText(passwordToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  const handleOptionChange = (key: keyof PasswordGenerationOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very_strong': return 'success';
      case 'strong': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      default: return 'error';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Password Generator Demo
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generation Options
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Length: {options.length}</Typography>
          <Slider
            value={options.length || 12}
            onChange={(_, value) => handleOptionChange('length', value)}
            min={8}
            max={32}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeUppercase ?? true}
                onChange={(e) => handleOptionChange('includeUppercase', e.target.checked)}
              />
            }
            label="Uppercase (A-Z)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeLowercase ?? true}
                onChange={(e) => handleOptionChange('includeLowercase', e.target.checked)}
              />
            }
            label="Lowercase (a-z)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeNumbers ?? true}
                onChange={(e) => handleOptionChange('includeNumbers', e.target.checked)}
              />
            }
            label="Numbers (0-9)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeSpecialChars ?? true}
                onChange={(e) => handleOptionChange('includeSpecialChars', e.target.checked)}
              />
            }
            label="Special Characters"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleGeneratePassword}
          >
            Generate Single Password
          </Button>
          <Button
            variant="outlined"
            onClick={handleGenerateMultiple}
          >
            Generate Multiple Options
          </Button>
        </Box>
      </Paper>

      {copySuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password copied to clipboard!
        </Alert>
      )}

      {password && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Password
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              value={password}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
                style: { fontFamily: 'monospace', fontSize: '1.1em' }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => handleCopyPassword(password)}
            >
              Copy
            </Button>
          </Box>
          <PasswordStrengthIndicator password={password} />
        </Paper>
      )}

      {multipleOptions.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Password Options (sorted by strength)
          </Typography>
          <Stack spacing={2}>
            {multipleOptions.map((option, index) => (
              <Box key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                  <TextField
                    value={option.password}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace' }
                    }}
                  />
                  <Chip
                    label={`${option.strength.replace('_', ' ').toUpperCase()} (${option.score})`}
                    color={getStrengthColor(option.strength) as any}
                    size="small"
                  />
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyPassword(option.password)}
                  >
                    Copy
                  </Button>
                </Box>
                {!option.meetsPolicy && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Policy violations: {option.policyErrors.join(', ')}
                  </Alert>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default PasswordGeneratorDemo;