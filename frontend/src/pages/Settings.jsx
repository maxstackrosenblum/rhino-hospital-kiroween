import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../hooks/useTheme.jsx';

function Settings() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useAppTheme();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Settings
          </Typography>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" component="h3">
                    Theme
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Switch between light and dark mode
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'light'}
                      onChange={toggleTheme}
                      color="primary"
                    />
                  }
                  label={mode === 'light' ? 'Light' : 'Dark'}
                  labelPlacement="start"
                />
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Close
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Settings;
