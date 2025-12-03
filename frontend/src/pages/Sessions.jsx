import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Sessions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revokeAllDialog, setRevokeAllDialog] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      setSuccess('Session revoked successfully');
      fetchSessions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }

      setSuccess('All sessions revoked. You will need to login again.');
      setRevokeAllDialog(false);
      
      // Logout after revoking all sessions
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to revoke sessions');
      setRevokeAllDialog(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <DevicesIcon />;
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    return '💻';
  };

  const isCurrentSession = (session) => {
    // Simple heuristic: most recent activity is likely current session
    const mostRecent = sessions.reduce((prev, current) => 
      new Date(current.last_activity) > new Date(prev.last_activity) ? current : prev
    , sessions[0]);
    return session.id === mostRecent?.id;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading sessions...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Active Sessions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetchSessions} title="Refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage your active login sessions across different devices
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {sessions.length > 1 && (
        <Button
          variant="outlined"
          color="error"
          onClick={() => setRevokeAllDialog(true)}
          sx={{ mb: 3 }}
          fullWidth={isMobile}
        >
          Revoke All Sessions
        </Button>
      )}

      <Stack spacing={2}>
        {sessions.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                No active sessions found
              </Typography>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    <Box sx={{ fontSize: '2rem' }}>
                      {getDeviceIcon(session.user_agent)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          {session.device_info || 'Unknown Device'}
                        </Typography>
                        {isCurrentSession(session) && (
                          <Chip label="Current" color="primary" size="small" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        <strong>IP:</strong> {session.ip_address || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Last Active:</strong> {formatDate(session.last_activity)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Expires:</strong> {formatDate(session.expires_at)}
                      </Typography>
                      {session.user_agent && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {session.user_agent}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleRevokeSession(session.id)}
                    title="Revoke this session"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Revoke All Dialog */}
      <Dialog open={revokeAllDialog} onClose={() => setRevokeAllDialog(false)}>
        <DialogTitle>Revoke All Sessions?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will log you out from all devices, including this one. You will need to login again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeAllDialog(false)}>Cancel</Button>
          <Button onClick={handleRevokeAll} color="error" variant="contained">
            Revoke All
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Sessions;
