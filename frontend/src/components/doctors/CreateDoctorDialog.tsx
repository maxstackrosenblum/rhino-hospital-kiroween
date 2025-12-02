import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { DoctorCreate } from "../../types";
import DoctorForm from "./DoctorForm";

interface CreateDoctorDialogProps {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (data: DoctorCreate) => void;
  submitError?: string | null;
}

function CreateDoctorDialog({
  open,
  isCreating,
  onClose,
  onSubmit,
  submitError,
}: CreateDoctorDialogProps) {
  const handleClose = () => {
    // Prevent closing dialog while creating
    if (!isCreating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isCreating}
    >
      <DialogTitle>Add New Doctor</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DoctorForm
          mode="create"
          onSubmit={onSubmit}
          onCancel={handleClose}
          isSubmitting={isCreating}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateDoctorDialog;
