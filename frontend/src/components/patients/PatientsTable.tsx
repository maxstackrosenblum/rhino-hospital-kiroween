import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountCircle as ProfileIcon,
} from "@mui/icons-material";
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
  onCompleteProfile: (patient: Patient) => void;
}

function PatientsTable({
  patients,
  searchTerm,
  canModify,
  canDelete,
  isLoading,
  onEdit,
  onDelete,
  onCompleteProfile,
}: PatientsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Medical Record</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Emergency Contact</TableCell>
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
                colSpan={canModify ? 11 : 10}
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
                colSpan={canModify ? 11 : 10}
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
              <TableRow key={patient.user_id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {patient.user_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {patient.first_name} {patient.last_name}
                </TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {patient.gender}
                </TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>
                  {patient.medical_record_number ? (
                    <Typography variant="body2" fontWeight={500}>
                      {patient.medical_record_number}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      Not set
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {patient.emergency_contact ? (
                    <Typography variant="body2">
                      {patient.emergency_contact}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      Not set
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(patient.created_at).toLocaleDateString()}
                </TableCell>
                {canModify && (
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
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
