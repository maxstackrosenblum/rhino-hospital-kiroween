import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { DoctorProfileCreate, DoctorUpdate } from "../../types";
import DoctorForm from "./DoctorForm";

interface CompleteDoctorProfileDialogProps {
  open: boolean;
  isCompleting: boolean;
  onClose: () => void;
  onSubmit: (data: DoctorProfileCreate) => void;
  submitError?: string | null;
}

function CompleteDoctorProfileDialog({
  open,
  isCompleting,
  onClose,
  onSubmit,
  submitError,
}: CompleteDoctorProfileDialogProps) {
  const handleClose = () => {
    // Prevent closing dialog while completing profile
    if (!isCompleting) {
      onClose();
    }
  };

  const handleSubmit = (data: DoctorProfileCreate | DoctorUpdate) => {
    // Type guard to ensure we only get DoctorProfileCreate in profile mode
    onSubmit(data as DoctorProfileCreate);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isCompleting}
    >
      <DialogTitle>Complete Doctor Profile</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DoctorForm
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

export default CompleteDoctorProfileDialog;
