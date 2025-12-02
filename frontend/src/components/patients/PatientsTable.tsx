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
import { Patient } from "../../types";

interface PatientsTableProps {
  patients: Patient[];
  searchTerm: string;
  canModify: boolean;
  canDelete: boolean;
  isLoading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

function PatientsTable({
  patients,
  searchTerm,
  canModify,
  canDelete,
  isLoading,
  onEdit,
  onDelete,
}: PatientsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Registered</TableCell>
            {canModify && (
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={canModify ? 9 : 8}
                align="center"
                sx={{ py: 6 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Loading patients...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : patients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canModify ? 9 : 8}
                align="center"
                sx={{ py: 6 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    {searchTerm
                      ? "No patients found"
                      : "No patients registered"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? `No patients match "${searchTerm}". Try searching by name, email, or phone number.`
                      : "Get started by adding your first patient record."}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  {patient.first_name} {patient.last_name}
                </TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {patient.gender}
                </TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.city}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ maxWidth: 200, wordBreak: "break-word" }}
                  >
                    {patient.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(patient.created_at).toLocaleDateString()}
                </TableCell>
                {canModify && (
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        onClick={() => onEdit(patient)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      {canDelete && (
                        <IconButton
                          onClick={() => onDelete(patient)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
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

export default PatientsTable;
