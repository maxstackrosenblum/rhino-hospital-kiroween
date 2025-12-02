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
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteCurrentUser } from '../api';

function Navbar({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        {/* Mobile Menu Icon */}
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleMobileMenu}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          onClick={() => navigate('/')}
          sx={{
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
            background: `linear-gradient(135deg, ${theme.palette.primary.gradient.start}, ${theme.palette.primary.gradient.end})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            flexGrow: { xs: 1, md: 0 },
          }}
        >
          {isMobile ? 'HMS' : 'Hospital Management System'}
        </Typography>

        {/* Desktop Navigation Menu */}
        {!isMobile && (
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
        )}

        {/* User Menu */}
        <IconButton
          onClick={handleMenuOpen}
          title={`${user.first_name} ${user.last_name}`}
          sx={{ ml: { xs: 0, md: 2 } }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              background: `linear-gradient(135deg, ${theme.palette.primary.gradient.start}, ${theme.palette.primary.gradient.end})`,
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
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

        {/* Mobile Drawer Menu */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <Box sx={{ width: 250, pt: 2 }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/')}>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
              {user.role === 'admin' && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigation('/users')}>
                    <ListItemText primary="Staff" />
                  </ListItemButton>
                </ListItem>
              )}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/profile')}>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/settings')}>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDeleteClick();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemText primary="Delete Account" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

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
