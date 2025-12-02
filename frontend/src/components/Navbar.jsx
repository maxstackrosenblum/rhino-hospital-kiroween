import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          onClick={() => navigate('/')}
          sx={{
            cursor: 'pointer',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.gradient.start}, ${theme.palette.primary.gradient.end})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Hospital Management System
        </Typography>

        {/* Navigation Menu */}
        <Box sx={{ flexGrow: 1, ml: 3 }}>
          {user.role === 'admin' && (
            <Button
              color="primary"
              onClick={() => navigate('/users')}
            >
              Staff
            </Button>
          )}
        </Box>

        {/* User Menu */}
        <IconButton
          onClick={handleMenuOpen}
          title={`${user.first_name} ${user.last_name}`}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              background: `linear-gradient(135deg, ${theme.palette.primary.gradient.start}, ${theme.palette.primary.gradient.end})`,
            }}
          >
            {getInitials(user.first_name, user.last_name)}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleNavigation('/profile')}>
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/settings')}>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={onLogout}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
