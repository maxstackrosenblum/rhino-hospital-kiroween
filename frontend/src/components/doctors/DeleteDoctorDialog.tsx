import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Doctor } from "../../types";

interface DeleteDoctorDialogProps {
  open: boolean;
  doctor: Doctor | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteDoctorDialog({
  open,
  doctor,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDoctorDialogProps) {
  const handleClose = () => {
    // Prevent closing dialog while deleting
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-doctor-dialog-title"
      disableEscapeKeyDown={isDeleting}
    >
      <DialogTitle id="delete-doctor-dialog-title">Delete Doctor?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete doctor{" "}
          <Box component="strong" sx={{ color: "text.primary" }}>
            {doctor?.first_name} {doctor?.last_name}
          </Box>{" "}
          (ID: {doctor?.doctor_id})? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" disabled={isDeleting}>
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
          {isDeleting ? "Deleting..." : "Delete Doctor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteDoctorDialog;
