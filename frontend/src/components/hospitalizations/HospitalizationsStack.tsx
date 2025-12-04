import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalHospital as HospitalIcon,
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
import { Hospitalization } from "../../types";

interface HospitalizationsStackProps {
  hospitalizations: Hospitalization[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (hospitalization: Hospitalization) => void;
  onDelete: (hospitalization: Hospitalization) => void;
}

function HospitalizationsStack({
  hospitalizations,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
}: HospitalizationsStackProps) {
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
              Loading hospitalizations...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (hospitalizations.length === 0) {
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
            <HospitalIcon sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? "No hospitalizations found" : "No hospitalizations recorded"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No hospitalizations match "${searchTerm}". Try searching by patient name.`
                : "Get started by adding your first hospitalization record."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {hospitalizations.map((hospitalization) => (
        <Card key={hospitalization.id} elevation={2}>
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
                    {hospitalization.patient_first_name}{" "}
                    {hospitalization.patient_last_name}
                  </Typography>
                  <Chip
                    label={hospitalization.discharge_date ? "Discharged" : "Active"}
                    color={hospitalization.discharge_date ? "default" : "success"}
                    variant="filled"
                    size="small"
                  />
                  {hospitalization.patient_age && (
                    <Chip
                      label={`Age: ${hospitalization.patient_age}`}
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
                  <strong>Patient ID:</strong> {hospitalization.patient_id}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Admission Date:</strong>{" "}
                  {new Date(hospitalization.admission_date).toLocaleDateString()}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Discharge Date:</strong>{" "}
                  {hospitalization.discharge_date
                    ? new Date(hospitalization.discharge_date).toLocaleDateString()
                    : "Still admitted"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Diagnosis:</strong> {hospitalization.diagnosis}
                </Typography>
                {hospitalization.summary && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Summary:</strong> {hospitalization.summary}
                  </Typography>
                )}
                {hospitalization.doctors && hospitalization.doctors.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      <strong>Doctors:</strong>
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {hospitalization.doctors.map((doctor) => (
                        <Chip
                          key={doctor.id}
                          label={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <IconButton
                  onClick={() => onEdit(hospitalization)}
                  color="primary"
                  size="small"
                  title="Edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(hospitalization)}
                  color="error"
                  size="small"
                  title="Delete"
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

export default HospitalizationsStack;