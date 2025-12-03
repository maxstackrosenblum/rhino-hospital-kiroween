import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { MedicalStaff, MedicalStaffCreate } from "../../types";
import MedicalStaffForm from "./MedicalStaffForm";

interface CompleteMedicalStaffProfileDialogProps {
  open: boolean;
  medicalStaff: MedicalStaff | null;
  isCompleting: boolean;
  onClose: () => void;
  onSubmit: (data: MedicalStaffCreate) => void;
  submitError?: string | null;
}

function CompleteMedicalStaffProfileDialog({
  open,
  medicalStaff,
  isCompleting,
  onClose,
  onSubmit,
  submitError,
}: CompleteMedicalStaffProfileDialogProps) {
  const handleClose = () => {
    if (!isCompleting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isCompleting}
    >
      <DialogTitle>Complete Medical Staff Profile</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <MedicalStaffForm
          mode="profile"
          initialData={medicalStaff || undefined}
          onSubmit={onSubmit as any}
          onCancel={handleClose}
          isSubmitting={isCompleting}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CompleteMedicalStaffProfileDialog;
