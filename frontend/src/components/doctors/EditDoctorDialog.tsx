import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Doctor, DoctorUpdate } from "../../types";
import DoctorForm from "./DoctorForm";

interface EditDoctorDialogProps {
  open: boolean;
  doctor: Doctor | null;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: (data: DoctorUpdate) => void;
  submitError?: string | null;
}

function EditDoctorDialog({
  open,
  doctor,
  isUpdating,
  onClose,
  onSubmit,
  submitError = null,
}: EditDoctorDialogProps) {
  const handleClose = () => {
    // Prevent closing dialog while updating
    if (!isUpdating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isUpdating}
    >
      <DialogTitle>Edit Doctor</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DoctorForm
          mode="update"
          initialData={doctor || undefined}
          onSubmit={onSubmit}
          onCancel={handleClose}
          isSubmitting={isUpdating}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditDoctorDialog;
