import { Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShifts } from "../api/shifts";
import { User } from "../types";

interface ShiftsReportProps {
  user: User;
}

function ShiftsReport({ user }: ShiftsReportProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("summary");
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  // Check permissions
  useEffect(() => {
    if (!["admin", "accountant"].includes(user.role)) {
      navigate("/");
    }
  }, [user, navigate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, roleFilter, searchTerm]);

  const { data: shiftsResponse, isLoading, error } = useShifts({
    page,
    page_size: pageSize,
    start_date: startDate,
    end_date: endDate,
    role: roleFilter || undefined,
    search: searchTerm || undefined,
  });

  const shifts = shiftsResponse?.shifts || [];
  const totalPages = shiftsResponse?.total_pages || 0;
  const totalRecords = shiftsResponse?.total || 0;

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "success";
      case "medical_staff":
        return "info";
      case "receptionist":
        return "info";
      default:
        return "default";
    }
  };

  // Calculate total hours for the period
  const totalMinutes = shifts.reduce((sum, shift) => sum + shift.total_hours, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Calculate summary data (group by user)
  const summaryData = shifts.reduce((acc, shift) => {
    const userId = shift.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user_id: userId,
        user_first_name: shift.user_first_name,
        user_last_name: shift.user_last_name,
        user_role: shift.user_role,
        total_minutes: 0,
        shift_count: 0,
      };
    }
    acc[userId].total_minutes += shift.total_hours;
    acc[userId].shift_count += 1;
    return acc;
  }, {} as Record<number, { user_id: number; user_first_name?: string; user_last_name?: string; user_role?: string; total_minutes: number; shift_count: number }>);

  const summaryArray = Object.values(summaryData).sort((a, b) => b.total_minutes - a.total_minutes);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" fontWeight={700} sx={{ mb: 3 }}>
          Shifts Report
        </Typography>

        {/* Filters */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <TextField
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={roleFilter}
              label="Filter by Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="medical_staff">Medical Staff</MenuItem>
              <MenuItem value="receptionist">Receptionist</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              label="View Mode"
              onChange={(e) => setViewMode(e.target.value as "detailed" | "summary")}
            >
              <MenuItem value="summary">Summary View</MenuItem>
              <MenuItem value="detailed">Detailed View</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Summary */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: "primary.light", color: "primary.contrastText" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Total Hours: {totalHours}h {totalMins}m
            </Typography>
            <Typography variant="body1">
              {totalRecords} shift records
            </Typography>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load shifts report
          </Alert>
        )}

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
              ) : viewMode === "summary" ? (
                summaryArray.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography variant="h6" color="text.secondary">
                        No shifts found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryArray.map((summary) => (
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
                )
              ) : (
                shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="h6" color="text.secondary">
                        No shifts found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
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
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Controls - Only show in detailed view */}
        {viewMode === "detailed" && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {shifts.length} of {totalRecords} shifts
              </Typography>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per page</InputLabel>
                <Select
                  value={pageSize}
                  label="Per page"
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Pagination 
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default ShiftsReport;
