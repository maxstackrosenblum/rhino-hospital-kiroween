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
import { MedicalStaff } from "../../types";

interface MedicalStaffTableProps {
  medicalStaff: MedicalStaff[];
  searchTerm: string;
  isLoading: boolean;
  onEdit: (staff: MedicalStaff) => void;
  onDelete: (staff: MedicalStaff) => void;
  onCompleteProfile: (staff: MedicalStaff) => void;
}

function MedicalStaffTable({
  medicalStaff,
  searchTerm,
  isLoading,
  onEdit,
  onDelete,
  onCompleteProfile,
}: MedicalStaffTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Job Title</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Shift Schedule</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
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
                    Loading medical staff...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : medicalStaff.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
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
                      ? "No medical staff found"
                      : "No medical staff registered"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? `No medical staff match "${searchTerm}". Try searching by name or email.`
                      : "Get started by completing profiles for users with medical_staff role."}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            medicalStaff.map((staff) => {
              const hasProfile = staff.id !== null;

              return (
                <TableRow key={staff.user_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {staff.user_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {staff.first_name} {staff.last_name}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        textTransform: "capitalize",
                        color:
                          staff.role === "receptionist"
                            ? "primary.main"
                            : "success.main",
                        fontWeight: 500,
                      }}
                    >
                      {staff.role === "medical_staff"
                        ? "Medical Staff"
                        : "Receptionist"}
                    </Typography>
                  </TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>{staff.phone || "-"}</TableCell>
                  <TableCell>
                    {staff.job_title ? (
                      <Typography variant="body2">{staff.job_title}</Typography>
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
                    {staff.department ? (
                      <Typography variant="body2">
                        {staff.department}
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
                    {staff.shift_schedule ? (
                      <Typography variant="body2">
                        {staff.shift_schedule}
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
                    <Box sx={{ display: "flex", gap: 1 }}>
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
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MedicalStaffTable;
