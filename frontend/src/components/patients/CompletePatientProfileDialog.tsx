import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { PatientProfileCreate, PatientUpdate } from "../../types";
import PatientForm from "./PatientForm";

interface CompletePatientProfileDialogProps {
  open: boolean;
  isCompleting: boolean;
  onClose: () => void;
  onSubmit: (data: PatientProfileCreate) => void;
  submitError?: string | null;
}

function CompletePatientProfileDialog({
  open,
  isCompleting,
  onClose,
  onSubmit,
  submitError,
}: CompletePatientProfileDialogProps) {
  const handleClose = () => {
    // Prevent closing dialog while completing profile
    if (!isCompleting) {
      onClose();
    }
  };

  const handleSubmit = (data: PatientProfileCreate | PatientUpdate) => {
    // Type guard to ensure we only get PatientProfileCreate in profile mode
    onSubmit(data as PatientProfileCreate);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isCompleting}
    >
      <DialogTitle>Complete Patient Profile</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <PatientForm
          mode="profile"
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isCompleting}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CompletePatientProfileDialog;
