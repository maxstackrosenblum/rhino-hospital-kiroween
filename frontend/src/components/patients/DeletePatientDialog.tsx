import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Patient } from "../../types";

interface DeletePatientDialogProps {
  open: boolean;
  patient: Patient | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeletePatientDialog({
  open,
  patient,
  isDeleting,
  onClose,
  onConfirm,
}: DeletePatientDialogProps) {
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
      aria-labelledby="delete-patient-dialog-title"
      disableEscapeKeyDown={isDeleting}
    >
      <DialogTitle id="delete-patient-dialog-title">
        Delete Patient?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete patient{" "}
          <Box component="strong" sx={{ color: "text.primary" }}>
            {patient?.first_name} {patient?.last_name}
          </Box>
          ? This action cannot be undone.
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
          {isDeleting ? "Deleting..." : "Delete Patient"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeletePatientDialog;
