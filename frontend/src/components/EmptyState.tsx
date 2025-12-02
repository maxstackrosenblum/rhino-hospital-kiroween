import { Box, Button, Paper, Typography } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

/**
 * EmptyState component
 * Displays an empty state message with optional action button
 * Accessible with proper semantic HTML and ARIA attributes
 * 
 * Requirements: 16.2
 */

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Paper
      className="empty-state"
      sx={{
        p: { xs: 3, sm: 4 },
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      <Box
        className="empty-state-icon"
        sx={{
          fontSize: { xs: '3rem', sm: '4rem' },
          color: 'text.disabled',
          mb: 2,
        }}
        aria-hidden="true"
      >
        {icon || <InboxIcon fontSize="inherit" />}
      </Box>

      <Typography
        variant="h5"
        component="h2"
        className="empty-state-title"
        sx={{
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 600,
          color: 'text.primary',
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body1"
          className="empty-state-description"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            color: 'text.secondary',
            mb: actionLabel ? 3 : 0,
            maxWidth: '500px',
            mx: 'auto',
          }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          sx={{ mt: 2 }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}

export default EmptyState;
