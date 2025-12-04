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
import { Doctor } from "../../types";

interface DoctorsStackProps {
  doctors: Doctor[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  onCompleteProfile: (doctor: Doctor) => void;
}

function DoctorsStack({
  doctors,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
  onCompleteProfile,
}: DoctorsStackProps) {
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
              Loading doctors...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (doctors.length === 0) {
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
              {searchTerm ? "No doctors found" : "No doctors registered"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No doctors match "${searchTerm}". Try searching by name, email, or doctor ID.`
                : "Get started by adding your first doctor record."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {doctors.map((doctor) => (
        <Card key={doctor.user_id} elevation={2}>
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
                    {doctor.first_name} {doctor.last_name}
                  </Typography>
                  {!doctor.profile_completed && (
                    <Chip
                      label="Profile Incomplete"
                      color="warning"
                      variant="filled"
                      size="small"
                    />
                  )}
                  {doctor.department && (
                    <Chip
                      label={doctor.department}
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
                  <strong>User ID:</strong> {doctor.user_id}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Doctor ID:</strong>{" "}
                  {doctor.doctor_id || (
                    <span style={{ fontStyle: "italic" }}>Not set</span>
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Phone:</strong> {doctor.phone}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Email:</strong> {doctor.email}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Specialization:</strong>{" "}
                  {doctor.specialization || (
                    <span style={{ fontStyle: "italic" }}>Not set</span>
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Qualifications:</strong>{" "}
                  {doctor.qualifications && doctor.qualifications.length > 0 ? (
                    doctor.qualifications.join(", ")
                  ) : (
                    <span style={{ fontStyle: "italic" }}>Not set</span>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Registered:</strong>{" "}
                  {new Date(doctor.created_at).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {!doctor.profile_completed && (
                  <IconButton
                    onClick={() => onCompleteProfile(doctor)}
                    color="warning"
                    size="small"
                    title="Complete Profile"
                  >
                    <ProfileIcon />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => onEdit(doctor)}
                  color="primary"
                  size="small"
                  title="Edit"
                  disabled={!doctor.doctor_id}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(doctor)}
                  color="error"
                  size="small"
                  title="Delete"
                  disabled={!doctor.doctor_id}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default DoctorsStack;