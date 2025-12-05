import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from "@mui/icons-material";

function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const preference = searchParams.get("preference") || "all";

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  // Checkboxes represent what user wants to KEEP receiving (checked = keep subscribed)
  const [selectedPreferences, setSelectedPreferences] = useState({
    appointment_updates: true,  // Start with both enabled
    blood_pressure_alerts: true,
  });

  useEffect(() => {
    if (!token) {
      setError("Invalid unsubscribe link");
      setLoading(false);
      setVerifying(false);
      return;
    }

    // Verify token
    fetch(`${import.meta.env.VITE_API_URL}/api/unsubscribe/verify?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired token");
        return res.json();
      })
      .then((data) => {
        setUserInfo(data);
        // Initialize checkboxes based on current preferences (checked = currently subscribed)
        setSelectedPreferences({
          appointment_updates: data.current_preferences?.appointment_updates ?? true,
          blood_pressure_alerts: data.current_preferences?.blood_pressure_alerts ?? true,
        });
        // Pre-uncheck the preference from the email link
        if (preference === "appointments") {
          setSelectedPreferences(prev => ({ ...prev, appointment_updates: false }));
        } else if (preference === "blood_pressure") {
          setSelectedPreferences(prev => ({ ...prev, blood_pressure_alerts: false }));
        } else if (preference === "all") {
          setSelectedPreferences({ appointment_updates: false, blood_pressure_alerts: false });
        }
        setVerifying(false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to verify unsubscribe link");
        setVerifying(false);
        setLoading(false);
      });
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    setUnsubscribing(true);
    setError(null);

    try {
      // Determine which preferences to disable (unchecked = unsubscribe)
      let prefParam = "all";
      if (!selectedPreferences.appointment_updates && selectedPreferences.blood_pressure_alerts) {
        prefParam = "appointments";
      } else if (selectedPreferences.appointment_updates && !selectedPreferences.blood_pressure_alerts) {
        prefParam = "blood_pressure";
      } else if (!selectedPreferences.appointment_updates && !selectedPreferences.blood_pressure_alerts) {
        prefParam = "all";
      } else {
        // Both are checked - nothing to unsubscribe from
        setSuccess(true);
        setUnsubscribing(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/unsubscribe?token=${token}&preference=${prefParam}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unsubscribe");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to unsubscribe");
    } finally {
      setUnsubscribing(false);
    }
  };

  if (loading || verifying) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" color="text.secondary">
                Verifying unsubscribe link...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error && !userInfo) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 4 }}>
              <ErrorIcon sx={{ fontSize: 64, color: "error.main" }} />
              <Typography variant="h5" fontWeight={600}>
                Invalid Link
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                {error}
              </Typography>
              <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>
                Go to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: "success.main" }} />
              <Typography variant="h5" fontWeight={600}>
                Successfully Unsubscribed
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                You have been unsubscribed from the selected email notifications.
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                You can update your email preferences anytime by logging into your account and visiting your profile settings.
              </Typography>
              <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>
                Go to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
            Unsubscribe from Emails
          </Typography>

          {userInfo && (
            <Box sx={{ mt: 3, mb: 4 }}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Email: <strong>{userInfo.email}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                {userInfo.first_name} {userInfo.last_name}
              </Typography>
            </Box>
          )}

          <Typography variant="body1" sx={{ mb: 1 }}>
            Manage your email notification preferences:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Uncheck the notifications you no longer wish to receive.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPreferences.appointment_updates}
                  onChange={(e) =>
                    setSelectedPreferences({ ...selectedPreferences, appointment_updates: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Appointment Updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirmations and status changes for your appointments
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPreferences.blood_pressure_alerts}
                  onChange={(e) =>
                    setSelectedPreferences({ ...selectedPreferences, blood_pressure_alerts: e.target.checked })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Blood Pressure Alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Notifications when your blood pressure readings are abnormal
                  </Typography>
                </Box>
              }
            />

          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Security-related emails (password reset, account changes) cannot be disabled and will always be sent.
            </Typography>
          </Alert>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" fullWidth onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleUnsubscribe}
              disabled={unsubscribing}
            >
              {unsubscribing ? "Unsubscribing..." : "Unsubscribe"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Unsubscribe;
