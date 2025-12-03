import { Alert, Box, Button, Collapse, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface NetworkErrorHandlerProps {
  children: React.ReactNode;
}

function NetworkErrorHandler({ children }: NetworkErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Show alert if already offline
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setShowOfflineAlert(false);
  };

  const handleRetry = () => {
    // Force a page refresh to retry network requests
    window.location.reload();
  };

  return (
    <>
      <Collapse in={showOfflineAlert}>
        <Alert
          severity="warning"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            borderRadius: 0,
          }}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              {isOnline && (
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Retry
                </Button>
              )}
              <Button color="inherit" size="small" onClick={handleDismiss}>
                Dismiss
              </Button>
            </Box>
          }
        >
          <Typography variant="body2">
            {isOnline
              ? "Connection restored! Some data may be outdated."
              : "You're currently offline. Some features may not work properly."}
          </Typography>
        </Alert>
      </Collapse>
      <Box sx={{ pt: showOfflineAlert ? 7 : 0 }}>{children}</Box>
    </>
  );
}

export default NetworkErrorHandler;
