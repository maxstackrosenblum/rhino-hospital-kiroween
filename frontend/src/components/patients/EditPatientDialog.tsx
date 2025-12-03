import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Patient, PatientUpdate } from "../../types";
import PatientForm from "./PatientForm";

interface EditPatientDialogProps {
  open: boolean;
  patient: Patient | null;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: (data: PatientUpdate) => void;
  submitError?: string | null;
}

function EditPatientDialog({
  open,
  patient,
  isUpdating,
  onClose,
  onSubmit,
  submitError = null,
}: EditPatientDialogProps) {
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
      <DialogTitle>Edit Patient</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <PatientForm
          mode="update"
          initialData={patient || undefined}
          onSubmit={onSubmit}
          onCancel={handleClose}
          isSubmitting={isUpdating}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditPatientDialog;
