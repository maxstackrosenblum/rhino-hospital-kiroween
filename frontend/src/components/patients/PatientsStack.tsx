import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountCircle as ProfileIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Patient } from "../../types";

interface PatientsStackProps {
  patients: Patient[];
  searchTerm: string;
  canModify: boolean;
  canDelete: boolean;
  isLoading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onCompleteProfile: (patient: Patient) => void;
}

function PatientsStack({
  patients,
  searchTerm,
  canModify,
  canDelete,
  isLoading,
  onEdit,
  onDelete,
  onCompleteProfile,
}: PatientsStackProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 4,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading patients...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              py: 4,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? "No patients found" : "No patients registered"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No patients match "${searchTerm}". Try searching by name, email, or phone number.`
                : "Get started by adding your first patient record."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {patients.map((patient) => (
        <Card key={patient.user_id} elevation={2}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    mb: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="h6">
                    {patient.first_name} {patient.last_name}
                  </Typography>
                  {!patient.profile_completed && (
                    <Chip
                      label="Profile Incomplete"
                      color="warning"
                      variant="filled"
                      size="small"
                    />
                  )}
                  {patient.gender && (
                    <Chip
                      label={
                        patient.gender.charAt(0).toUpperCase() +
                        patient.gender.slice(1)
                      }
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>User ID:</strong> {patient.user_id}
                </Typography>
                {patient.age && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Age:</strong> {patient.age}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Phone:</strong> {patient.phone}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Email:</strong> {patient.email}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Medical Record:</strong>{" "}
                  {patient.medical_record_number || (
                    <span style={{ fontStyle: "italic" }}>Not set</span>
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Emergency Contact:</strong>{" "}
                  {patient.emergency_contact || (
                    <span style={{ fontStyle: "italic" }}>Not set</span>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Registered:</strong>{" "}
                  {new Date(patient.created_at).toLocaleDateString()}
                </Typography>
              </Box>

              {canModify && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {!patient.profile_completed && (
                    <IconButton
                      onClick={() => onCompleteProfile(patient)}
                      color="warning"
                      size="small"
                      title="Complete Profile"
                    >
                      <ProfileIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => onEdit(patient)}
                    color="primary"
                    size="small"
                    title="Edit"
                    disabled={!patient.medical_record_number}
                  >
                    <EditIcon />
                  </IconButton>
                  {canDelete && (
                    <IconButton
                      onClick={() => onDelete(patient)}
                      color="error"
                      size="small"
                      title="Delete"
                      disabled={!patient.medical_record_number}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default PatientsStack;
