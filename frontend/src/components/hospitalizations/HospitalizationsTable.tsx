import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Hospitalization } from "../../types";

interface HospitalizationsTableProps {
  hospitalizations: Hospitalization[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (hospitalization: Hospitalization) => void;
  onDelete: (hospitalization: Hospitalization) => void;
}

function HospitalizationsTable({
  hospitalizations,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
}: HospitalizationsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Admission Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Discharge Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Diagnosis</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Doctors</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Summary</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : hospitalizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? "No hospitalizations found" : "No hospitalizations recorded"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm
                    ? `No hospitalizations match "${searchTerm}". Try searching by patient name.`
                    : "Get started by adding your first hospitalization record."}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            hospitalizations.map((hospitalization) => (
              <TableRow key={hospitalization.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {hospitalization.patient_first_name}{" "}
                      {hospitalization.patient_last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Age: {hospitalization.patient_age} • ID:{" "}
                      {hospitalization.patient_id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(hospitalization.admission_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {hospitalization.discharge_date
                    ? new Date(hospitalization.discharge_date).toLocaleDateString()
                    : "Active"}
                </TableCell>
                <TableCell>{hospitalization.diagnosis}</TableCell>
                <TableCell>
                  {hospitalization.doctors && hospitalization.doctors.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {hospitalization.doctors.map((doctor) => (
                        <Chip
                          key={doctor.id}
                          label={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No doctors assigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{hospitalization.summary || "-"}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      onClick={() => onEdit(hospitalization)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => onDelete(hospitalization)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default HospitalizationsTable;