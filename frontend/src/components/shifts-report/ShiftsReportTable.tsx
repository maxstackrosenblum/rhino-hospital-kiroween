import {
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Shift } from "../../types";

interface ShiftsReportTableProps {
  shifts: Shift[];
  summaryData: Array<{
    user_id: number;
    user_first_name?: string;
    user_last_name?: string;
    user_role?: string;
    total_minutes: number;
    shift_count: number;
  }>;
  viewMode: "detailed" | "summary";
  searchTerm: string;
  isLoading: boolean;
  formatHours: (minutes: number) => string;
  getRoleColor: (role: string) => "success" | "info" | "default";
}

function ShiftsReportTable({
  shifts,
  summaryData,
  viewMode,
  searchTerm,
  isLoading,
  formatHours,
  getRoleColor,
}: ShiftsReportTableProps) {
  const dataToShow = viewMode === "summary" ? summaryData : shifts;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Staff Member</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
            {viewMode === "detailed" && (
              <>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
              </>
            )}
            <TableCell sx={{ fontWeight: 600 }}>Total Hours</TableCell>
            {viewMode === "detailed" && <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>}
            {viewMode === "summary" && <TableCell sx={{ fontWeight: 600 }}>Shifts Count</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={viewMode === "detailed" ? 7 : 5} align="center" sx={{ py: 6 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : dataToShow.length === 0 ? (
            <TableRow>
              <TableCell colSpan={viewMode === "detailed" ? 7 : 5} align="center" sx={{ py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? "No shifts found" : "No shifts for the selected period"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm
                    ? `No shifts match "${searchTerm}". Try adjusting your search or date range.`
                    : "Try adjusting your date range or filters to see shift data."}
                </Typography>
              </TableCell>
            </TableRow>
          ) : viewMode === "summary" ? (
            summaryData.map((summary) => (
              <TableRow key={summary.user_id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {summary.user_first_name} {summary.user_last_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={summary.user_role?.replace('_', ' ').toUpperCase()} 
                    color={getRoleColor(summary.user_role || '')}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight={600}>
                    {formatHours(summary.total_minutes)}
                  </Typography>
                </TableCell>
                <TableCell>{summary.shift_count}</TableCell>
              </TableRow>
            ))
          ) : (
            shifts.map((shift) => (
              <TableRow key={shift.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {shift.user_first_name} {shift.user_last_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={shift.user_role?.replace('_', ' ').toUpperCase()} 
                    color={getRoleColor(shift.user_role || '')}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(shift.date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell>{new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell>{formatHours(shift.total_hours)}</TableCell>
                <TableCell>{shift.notes || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ShiftsReportTable;