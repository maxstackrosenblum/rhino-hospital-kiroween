import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { User } from "../../types";

interface DeleteUserDialogProps {
  open: boolean;
  user: User | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteUserDialog({
  open,
  user,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteUserDialogProps) {
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-user-dialog-title"
      disableEscapeKeyDown={isDeleting}
    >
      <DialogTitle id="delete-user-dialog-title">Delete User?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete user{" "}
          <Box component="strong" sx={{ color: "text.primary" }}>
            {user?.username}
          </Box>
          ? This will soft delete the account and the user will no longer be
          able to log in.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
          sx={{
            color: "#ffffff",
            "&:hover": {
              color: "#ffffff",
            },
          }}
        >
          {isDeleting ? "Deleting..." : "Delete User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteUserDialog;
