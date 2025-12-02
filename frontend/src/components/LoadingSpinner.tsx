import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingSpinner component
 * Displays a loading spinner with optional message
 * Accessible to screen readers with aria-live region
 * 
 * Requirements: 16.2
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  minHeight?: string;
}

function LoadingSpinner({ 
  message = 'Loading...', 
  size = 40,
  minHeight = '200px'
}: LoadingSpinnerProps) {
  return (
    <Box
      className="loading-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: minHeight,
        padding: 2,
        gap: 2,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <CircularProgress size={size} aria-hidden="true" />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {message}
      </Typography>
      {/* Screen reader only text */}
      <span className="sr-only">{message}</span>
    </Box>
  );
}

export default LoadingSpinner;
