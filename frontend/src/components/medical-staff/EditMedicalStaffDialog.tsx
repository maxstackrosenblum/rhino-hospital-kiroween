import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { MedicalStaff, MedicalStaffUpdate } from "../../types";
import MedicalStaffForm from "./MedicalStaffForm";

interface EditMedicalStaffDialogProps {
  open: boolean;
  medicalStaff: MedicalStaff | null;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: (data: MedicalStaffUpdate) => void;
  submitError?: string | null;
}

function EditMedicalStaffDialog({
  open,
  medicalStaff,
  isUpdating,
  onClose,
  onSubmit,
  submitError = null,
}: EditMedicalStaffDialogProps) {
  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isUpdating}
    >
      <DialogTitle>Edit Medical Staff</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <MedicalStaffForm
          mode="update"
          initialData={medicalStaff || undefined}
          onSubmit={onSubmit}
          onCancel={handleClose}
          isSubmitting={isUpdating}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditMedicalStaffDialog;
