import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { PatientCreate } from "../../types";
import PatientForm from "./PatientForm";

interface CreatePatientDialogProps {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (data: PatientCreate) => void;
  submitError?: string | null;
}

function CreatePatientDialog({
  open,
  isCreating,
  onClose,
  onSubmit,
  submitError,
}: CreatePatientDialogProps) {
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
      <DialogTitle>Add New Patient</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <PatientForm
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

export default CreatePatientDialog;
