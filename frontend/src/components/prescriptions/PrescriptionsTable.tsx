import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
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
import { Prescription } from "../../types";

interface PrescriptionsTableProps {
  prescriptions: Prescription[];
  searchTerm: string;
  isLoading: boolean;
  canWrite: boolean;
  onEdit: (prescription: Prescription) => void;
  onDelete: (prescription: Prescription) => void;
}

function PrescriptionsTable({
  prescriptions,
  searchTerm,
  isLoading,
  canWrite,
  onEdit,
  onDelete,
}: PrescriptionsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Medicines</TableCell>
            {canWrite && (
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={canWrite ? 4 : 3}
                align="center"
                sx={{ py: 6 }}
              >
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : prescriptions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canWrite ? 4 : 3}
                align="center"
                sx={{ py: 6 }}
              >
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? "No prescriptions found" : "No prescriptions recorded"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm
                    ? `No prescriptions match "${searchTerm}". Try searching by patient name.`
                    : "Get started by adding your first prescription record."}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            prescriptions.map((prescription) => (
              <TableRow key={prescription.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {prescription.patient_first_name}{" "}
                      {prescription.patient_last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Age: {prescription.patient_age} • ID:{" "}
                      {prescription.patient_id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(prescription.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {prescription.medicines.map((med, idx) => (
                    <Box key={idx} sx={{ mb: idx < prescription.medicines.length - 1 ? 1 : 0 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {med.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[med.dosage, med.frequency, med.duration]
                          .filter(Boolean)
                          .join(" • ")}
                      </Typography>
                    </Box>
                  ))}
                </TableCell>
                {canWrite && (
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        onClick={() => onEdit(prescription)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => onDelete(prescription)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default PrescriptionsTable;