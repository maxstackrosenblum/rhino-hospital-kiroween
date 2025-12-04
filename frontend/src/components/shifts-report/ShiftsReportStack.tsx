import {
  Assessment as ReportIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Shift } from "../../types";

interface ShiftsReportStackProps {
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

function ShiftsReportStack({
  shifts,
  summaryData,
  viewMode,
  searchTerm,
  isLoading,
  formatHours,
  getRoleColor,
}: ShiftsReportStackProps) {
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
              Loading shifts report...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const dataToShow = viewMode === "summary" ? summaryData : shifts;

  if (dataToShow.length === 0) {
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
            <ReportIcon sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? "No shifts found" : "No shifts for the selected period"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {searchTerm
                ? `No shifts match "${searchTerm}". Try adjusting your search or date range.`
                : "Try adjusting your date range or filters to see shift data."}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {viewMode === "summary" ? (
        // Summary View
        summaryData.map((summary) => (
          <Card key={summary.user_id} elevation={2}>
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
                      {summary.user_first_name} {summary.user_last_name}
                    </Typography>
                    <Chip
                      label={summary.user_role?.replace('_', ' ').toUpperCase()}
                      color={getRoleColor(summary.user_role || '')}
                      variant="filled"
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Total Hours:</strong>{" "}
                    <Typography
                      component="span"
                      variant="h6"
                      color="primary.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatHours(summary.total_minutes)}
                    </Typography>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Number of Shifts:</strong> {summary.shift_count}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>Average per Shift:</strong>{" "}
                    {formatHours(Math.round(summary.total_minutes / summary.shift_count))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        // Detailed View
        shifts.map((shift) => (
          <Card key={shift.id} elevation={2}>
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
                      {shift.user_first_name} {shift.user_last_name}
                    </Typography>
                    <Chip
                      label={shift.user_role?.replace('_', ' ').toUpperCase()}
                      color={getRoleColor(shift.user_role || '')}
                      variant="filled"
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Date:</strong>{" "}
                    {new Date(shift.date).toLocaleDateString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Time:</strong>{" "}
                    {new Date(shift.start_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(shift.end_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Total Hours:</strong>{" "}
                    <Typography
                      component="span"
                      variant="body1"
                      color="primary.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatHours(shift.total_hours)}
                    </Typography>
                  </Typography>
                  {shift.notes && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      <strong>Notes:</strong> {shift.notes}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}

export default ShiftsReportStack;