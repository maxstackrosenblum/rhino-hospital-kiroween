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
import { Doctor } from "../../types";

interface DoctorsTableProps {
  doctors: Doctor[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  onCompleteProfile: (doctor: Doctor) => void;
}

function DoctorsTable({
  doctors,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
  onCompleteProfile,
}: DoctorsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Doctor ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Qualification</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Registered</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
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
                    Loading doctors...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : doctors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    {searchTerm ? "No doctors found" : "No doctors registered"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? `No doctors match "${searchTerm}". Try searching by name, email, or doctor ID.`
                      : "Get started by adding your first doctor record."}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            doctors.map((doctor) => (
              <TableRow key={doctor.user_id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {doctor.user_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {doctor.doctor_id ? (
                    <Typography variant="body2" fontWeight={500}>
                      {doctor.doctor_id}
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
                  {doctor.first_name} {doctor.last_name}
                </TableCell>
                <TableCell>{doctor.phone}</TableCell>
                <TableCell>{doctor.email}</TableCell>
                <TableCell>
                  {doctor.qualifications ? (
                    <Typography
                      variant="body2"
                      sx={{ maxWidth: 150, wordBreak: "break-word" }}
                    >
                      {doctor.qualifications.join(", ")}
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
                  {doctor.department ? (
                    <Typography variant="body2">{doctor.department}</Typography>
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
                  {doctor.specialization ? (
                    <Typography variant="body2">
                      {doctor.specialization}
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
                  {new Date(doctor.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DoctorsTable;
