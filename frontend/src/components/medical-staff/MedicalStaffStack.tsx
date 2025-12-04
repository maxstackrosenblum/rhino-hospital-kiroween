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
import { MedicalStaff } from "../../types";

interface MedicalStaffStackProps {
  medicalStaff: MedicalStaff[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (staff: MedicalStaff) => void;
  onDelete: (staff: MedicalStaff) => void;
  onCompleteProfile: (staff: MedicalStaff) => void;
}

function MedicalStaffStack({
  medicalStaff,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
  onCompleteProfile,
}: MedicalStaffStackProps) {
  const getRoleChipColor = (role: string) => {
    switch (role) {
      case "medical_staff":
        return "info";
      case "receptionist":
        return "primary";
      default:
        return "default";
    }
  };

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
              Loading medical staff...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (medicalStaff.length === 0) {
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
              {searchTerm ? "No medical staff found" : "No medical staff registered"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No medical staff match "${searchTerm}". Try searching by name or email.`
                : "Get started by completing profiles for users with medical_staff role."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {medicalStaff.map((staff) => {
        const hasProfile = staff.id !== null;

        return (
          <Card key={staff.user_id} elevation={2}>
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
                      {staff.first_name} {staff.last_name}
                    </Typography>
                    {!hasProfile && (
                      <Chip
                        label="Profile Incomplete"
                        color="warning"
                        variant="filled"
                        size="small"
                      />
                    )}
                    <Chip
                      label={
                        staff.role === "medical_staff"
                          ? "Medical Staff"
                          : "Receptionist"
                      }
                      color={getRoleChipColor(staff.role)}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>User ID:</strong> {staff.user_id}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Email:</strong> {staff.email}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Phone:</strong> {staff.phone || "Not set"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Job Title:</strong>{" "}
                    {staff.job_title || (
                      <span style={{ fontStyle: "italic" }}>Not set</span>
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Department:</strong>{" "}
                    {staff.department || (
                      <span style={{ fontStyle: "italic" }}>Not set</span>
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Shift Schedule:</strong>{" "}
                    {staff.shift_schedule || (
                      <span style={{ fontStyle: "italic" }}>Not set</span>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Registered:</strong>{" "}
                    {new Date(staff.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {!hasProfile && (
                    <IconButton
                      onClick={() => onCompleteProfile(staff)}
                      color="warning"
                      size="small"
                      title="Complete Profile"
                    >
                      <ProfileIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => onEdit(staff)}
                    color="primary"
                    size="small"
                    title="Edit"
                    disabled={!hasProfile}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(staff)}
                    color="error"
                    size="small"
                    title="Delete"
                    disabled={!hasProfile}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

export default MedicalStaffStack;