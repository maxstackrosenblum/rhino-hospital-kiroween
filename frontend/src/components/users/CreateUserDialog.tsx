import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { UserCreate, UserCreateResponse } from "../../types";
import UserForm from "./UserForm";

interface CreateUserDialogProps {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreate) => void;
  submitError?: string | null;
  createResponse?: UserCreateResponse | null;
}

function CreateUserDialog({
  open,
  isCreating,
  onClose,
  onSubmit,
  submitError,
  createResponse,
}: CreateUserDialogProps) {
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
      <DialogTitle>Create New User Account</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <UserForm<"create">
          mode="create"
          onSubmit={onSubmit}
          onCancel={handleClose}
          isSubmitting={isCreating}
          submitError={submitError}
          emailStatus={createResponse ? {
            email_sent: createResponse.email_sent,
            email_error: createResponse.email_error
          } : null}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateUserDialog;
