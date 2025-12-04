import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface IdleWarningDialogProps {
  open: boolean;
  remainingTime: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

const IdleWarningDialog = ({
  open,
  remainingTime,
  onStayLoggedIn,
  onLogout,
}: IdleWarningDialogProps) => {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return (
    <Dialog open={open} onClose={onStayLoggedIn}>
      <DialogTitle>Session Timeout Warning</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have been inactive for a while. For your security, you will be
          automatically logged out in{' '}
          <strong>
            {minutes > 0 && `${minutes}m `}
            {seconds}s
          </strong>
          .
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          Do you want to stay logged in?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="error">
          Logout Now
        </Button>
        <Button onClick={onStayLoggedIn} variant="contained" autoFocus>
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdleWarningDialog;
