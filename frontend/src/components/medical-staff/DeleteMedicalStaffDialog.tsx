import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { MedicalStaff } from "../../types";

interface DeleteMedicalStaffDialogProps {
  open: boolean;
  medicalStaff: MedicalStaff | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteMedicalStaffDialog({
  open,
  medicalStaff,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteMedicalStaffDialogProps) {
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown={isDeleting}
    >
      <DialogTitle>Delete Medical Staff?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete{" "}
          <strong>
            {medicalStaff?.first_name} {medicalStaff?.last_name}
          </strong>
          ? This action cannot be undone.
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
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteMedicalStaffDialog;
