import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { AdminUserUpdate, User } from "../../types";
import UserForm from "./UserForm";

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: (data: AdminUserUpdate) => void;
  submitError?: string | null;
}

function EditUserDialog({
  open,
  user,
  isUpdating,
  onClose,
  onSubmit,
  submitError,
}: EditUserDialogProps) {
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
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <UserForm<"update">
          mode="update"
          initialData={user || undefined}
          onSubmit={onSubmit}
          onCancel={handleClose}
          isSubmitting={isUpdating}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditUserDialog;
