import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalPharmacy as PharmacyIcon,
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
import { Prescription } from "../../types";

interface PrescriptionsStackProps {
  prescriptions: Prescription[];
  searchTerm: string;
  isLoading: boolean;
  canWrite: boolean;
  onEdit: (prescription: Prescription) => void;
  onDelete: (prescription: Prescription) => void;
}

function PrescriptionsStack({
  prescriptions,
  searchTerm,
  isLoading,
  canWrite,
  onEdit,
  onDelete,
}: PrescriptionsStackProps) {
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
              Loading prescriptions...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (prescriptions.length === 0) {
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
            <PharmacyIcon sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? "No prescriptions found" : "No prescriptions recorded"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No prescriptions match "${searchTerm}". Try searching by patient name.`
                : "Get started by adding your first prescription record."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {prescriptions.map((prescription) => (
        <Card key={prescription.id} elevation={2}>
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
                    {prescription.patient_first_name}{" "}
                    {prescription.patient_last_name}
                  </Typography>
                  {prescription.patient_age && (
                    <Chip
                      label={`Age: ${prescription.patient_age}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  <Chip
                    label={`${prescription.medicines.length} medicine${
                      prescription.medicines.length !== 1 ? "s" : ""
                    }`}
                    color="info"
                    variant="filled"
                    size="small"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Patient ID:</strong> {prescription.patient_id}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Date:</strong>{" "}
                  {new Date(prescription.date).toLocaleDateString()}
                </Typography>

                {/* Medicines */}
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Medicines:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {prescription.medicines.map((medicine, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.5,
                          backgroundColor: "grey.50",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {medicine.name}
                        </Typography>
                        {medicine.dosage && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            <strong>Dosage:</strong> {medicine.dosage}
                          </Typography>
                        )}
                        {medicine.frequency && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            <strong>Frequency:</strong> {medicine.frequency}
                          </Typography>
                        )}
                        {medicine.duration && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            <strong>Duration:</strong> {medicine.duration}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              {canWrite && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <IconButton
                    onClick={() => onEdit(prescription)}
                    color="primary"
                    size="small"
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(prescription)}
                    color="error"
                    size="small"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default PrescriptionsStack;