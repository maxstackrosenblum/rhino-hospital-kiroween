import { Menu as MenuIcon } from "@mui/icons-material";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteCurrentUser } from "../api";

function Navbar({ user, onLogout }: any) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const deleteAccountMutation = useDeleteCurrentUser();

  const handleMenuOpen = (event: any) => {
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
        navigate("/login");
      },
      onError: (error) => {
        alert(error.message || "Failed to delete account");
      },
    });
  };

  const getInitials = (firstName: any, lastName: any) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const handleNavigation = (path: any) => {
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
        {/* Logo and Title */}
        <Box
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexGrow: { xs: 1, md: 0 },
            cursor: "pointer",
          }}
        >
          <img
            src="/logo-icon.png"
            alt="Hospital Logo"
            style={{
              height: isMobile ? "45px" : "60px",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.25rem" },
              background: `linear-gradient(135deg, ${
                (theme.palette.primary as any).gradient.start
              }, ${(theme.palette.primary as any).gradient.end})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isMobile ? "HMS" : "Hospital Management System"}
          </Typography>
        </Box>

        {/* Desktop Navigation Menu */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, ml: 3, display: 'flex', alignItems: 'center' }}>
            {["admin", "doctor", "receptionist"].includes(user.role) && (
              <>
                <Button color="primary" onClick={() => navigate("/patients")}>
                  Patients
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
              </>
            )}
            {["admin", "doctor", "medical_staff", "receptionist", "patient", "undefined"].includes(
              user.role
            ) && (
              <>
                <Button
                  color="primary"
                  onClick={() => navigate("/appointments")}
                >
                  Appointments
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
              </>
            )}
            {/* Blood Pressure Link */}
            {["admin", "doctor", "nurse", "medical_staff", "patient", "undefined"].includes(user.role) && (
              <>
                <Button
                  color="primary"
                  onClick={() => navigate("/blood-pressure")}
                >
                  Blood Pressure Checks
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
              </>
            )}
            {["admin", "doctor", "medical_staff", "receptionist"].includes(
              user.role
            ) && (
              <>
                <Button
                  color="primary"
                  onClick={() => navigate("/hospitalizations")}
                >
                  Hospitalizations
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                <Button
                  color="primary"
                  onClick={() => navigate("/prescriptions")}
                >
                  Prescriptions
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
              </>
            )}
            {/* My Shifts Link */}
            {["doctor", "medical_staff", "receptionist"].includes(
              user.role
            ) && (
              <>
                <Button color="primary" onClick={() => navigate("/shifts")}>
                  My Shifts
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
              </>
            )}
            {/* Shifts Link */}
            {["admin", "accountant"].includes(user.role) && (
              <>
                <Button
                  color="primary"
                  onClick={() => navigate("/shifts-report")}
                >
                  Shifts
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
              </>
            )}
            {user.role === "admin" && (
              <>
                <Button color="primary" onClick={() => navigate("/doctors")}>
                  Doctors
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                <Button
                  color="primary"
                  onClick={() => navigate("/medical-staff")}
                >
                  Medical Staff
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                <Button color="primary" onClick={() => navigate("/users")}>
                  Users
                </Button>
              </>
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
              bgcolor: "primary.main",
              background: `linear-gradient(135deg, ${
                (theme.palette.primary as any).gradient.start
              }, ${(theme.palette.primary as any).gradient.end})`,
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              fontSize: { xs: "0.875rem", sm: "1rem" },
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
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={() => handleNavigation("/profile")}>
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/sessions")}>
            Sessions
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/settings")}>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleDeleteClick}
            sx={{
              color: "error.main",
              "&:hover": {
                backgroundColor: (theme) => `${theme.palette.error.main}14`,
              },
            }}
          >
            Delete Account
          </MenuItem>
          <MenuItem onClick={onLogout}>Logout</MenuItem>
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
                <ListItemButton onClick={() => handleNavigation("/")}>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
              {["admin", "doctor", "receptionist"].includes(user.role) && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigation("/patients")}>
                    <ListItemText primary="Patients" />
                  </ListItemButton>
                </ListItem>
              )}
              {["admin", "doctor", "medical_staff", "receptionist", "patient", "undefined"].includes(
                user.role
              ) && (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation("/appointments")}
                  >
                    <ListItemText primary="Appointments" />
                  </ListItemButton>
                </ListItem>
              )}
              {["admin", "doctor", "medical_staff", "receptionist"].includes(
                user.role
              ) && (
                <>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation("/hospitalizations")}
                    >
                      <ListItemText primary="Hospitalizations" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation("/prescriptions")}
                    >
                      <ListItemText primary="Prescriptions" />
                    </ListItemButton>
                  </ListItem>
                </>
              )}
              {/* Shifts Section */}
              {[
                "doctor",
                "medical_staff",
                "receptionist",
                "admin",
                "accountant",
              ].includes(user.role) && (
                <>
                  {["doctor", "medical_staff", "receptionist"].includes(
                    user.role
                  ) && (
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigation("/shifts")}
                      >
                        <ListItemText primary="My Shifts" />
                      </ListItemButton>
                    </ListItem>
                  )}
                  {["admin", "accountant"].includes(user.role) && (
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigation("/shifts-report")}
                      >
                        <ListItemText primary="Shifts" />
                      </ListItemButton>
                    </ListItem>
                  )}
                </>
              )}
              {/* Blood Pressure Checks */}
              {["admin", "doctor", "nurse", "medical_staff", "patient", "undefined"].includes(user.role) && (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation("/blood-pressure")}
                  >
                    <ListItemText primary="Blood Pressure Checks" />
                  </ListItemButton>
                </ListItem>
              )}
              {user.role === "admin" && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation("/doctors")}
                    >
                      <ListItemText primary="Doctors" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation("/medical-staff")}
                    >
                      <ListItemText primary="Medical Staff" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleNavigation("/users")}>
                      <ListItemText primary="Users" />
                    </ListItemButton>
                  </ListItem>
                </>
              )}
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation("/profile")}>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation("/sessions")}>
                  <ListItemText primary="Sessions" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation("/settings")}>
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
                  sx={{ color: "error.main" }}
                >
                  <ListItemText primary="Delete Account" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                >
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
          <DialogTitle id="delete-dialog-title">Delete Account?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This action cannot
              be undone. You will be logged out immediately.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
