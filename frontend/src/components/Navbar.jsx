import {
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { useDeleteCurrentUser } from '../api';

function Navbar({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const deleteAccountMutation = useDeleteCurrentUser();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        onLogout();
        navigate('/login');
      },
      onError: (error) => {
        alert(error.message || 'Failed to delete account');
      },
    });
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
            <>
              <Button
                color="primary"
                onClick={() => navigate('/users')}
              >
                Users
              </Button>
              <Button
                color="primary"
                onClick={() => navigate('/receptionists')}
              >
                Receptionists
              </Button>
              <Button
                color="primary"
                onClick={() => navigate('/workers')}
              >
                Workers
              </Button>
            </>
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
          <MenuItem 
            onClick={handleDeleteClick} 
            sx={{ 
              color: 'error.main',
              '&:hover': {
                backgroundColor: (theme) => `${theme.palette.error.main}14`,
              }
            }}
          >
            Delete Account
          </MenuItem>
          <MenuItem onClick={onLogout}>
            Logout
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">
            Delete Account?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This action cannot be undone.
              You will be logged out immediately.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
