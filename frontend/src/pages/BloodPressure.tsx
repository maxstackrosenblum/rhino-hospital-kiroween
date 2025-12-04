import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Favorite as FavoriteIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { User } from "../types";
import { PaginationControls } from "../components/common";
import { useDebounce } from "../hooks/useDebounce";

interface BloodPressureProps {
  user: User;
}

interface BloodPressureReading {
  id: number;
  user_id: number;
  systolic: number;
  diastolic: number | null;
  reading_date: string;
  is_high_risk: boolean;
  created_at: string;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
}

interface Statistics {
  total_readings: number;
  high_risk_count: number;
  normal_count: number;
  average_systolic: number | null;
  average_diastolic: number | null;
  latest_reading_date: string | null;
}

function BloodPressure({ user }: BloodPressureProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    systolic: "",
    diastolic: "",
    reading_date: new Date().toISOString().slice(0, 16),
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMedicalStaff = ["admin", "doctor", "medical_staff", "receptionist"].includes(user.role);

  // Fetch readings
  const fetchReadings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("page_size", pageSize.toString());
      if (debouncedSearchTerm && isMedicalStaff) params.append("search", debouncedSearchTerm);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (highRiskOnly) params.append("high_risk_only", "true");

      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/blood-pressure?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch readings");

      const data = await response.json();
      setReadings(data.readings || []);
      setTotalPages(data.total_pages || 0);
      setTotalRecords(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/blood-pressure/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStatistics(data);
    } catch (err: any) {
      console.error("Failed to fetch statistics:", err);
    }
  };

  useEffect(() => {
    fetchReadings();
    fetchStatistics();
  }, [page, pageSize, debouncedSearchTerm, dateFrom, dateTo, highRiskOnly]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, dateFrom, dateTo, highRiskOnly]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    const systolic = parseInt(formData.systolic);
    if (!formData.systolic) {
      errors.systolic = "Systolic pressure is required";
    } else if (isNaN(systolic) || systolic < 50 || systolic > 300) {
      errors.systolic = "Systolic must be between 50 and 300 mmHg";
    }
    
    if (formData.diastolic) {
      const diastolic = parseInt(formData.diastolic);
      if (isNaN(diastolic) || diastolic < 30 || diastolic > 200) {
        errors.diastolic = "Diastolic must be between 30 and 200 mmHg";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
      const payload = {
        systolic: parseInt(formData.systolic),
        diastolic: formData.diastolic ? parseInt(formData.diastolic) : null,
        reading_date: new Date(formData.reading_date).toISOString(),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/blood-pressure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to add reading");
      }

      setSuccessMessage("Blood pressure reading added successfully!");
      setDialogOpen(false);
      setFormData({
        systolic: "",
        diastolic: "",
        reading_date: new Date().toISOString().slice(0, 16),
      });
      fetchReadings();
      fetchStatistics();
    } catch (err: any) {
      setFormErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (readingId: number) => {
    setReadingToDelete(readingId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!readingToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/blood-pressure/${readingToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete reading");
      }

      setSuccessMessage("Blood pressure reading deleted successfully!");
      setDeleteDialogOpen(false);
      setReadingToDelete(null);
      fetchReadings();
      fetchStatistics();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (systolic: number) => {
    if (systolic > 120) return "error"; // High
    if (systolic < 90) return "warning"; // Low
    return "success"; // Normal
  };

  const getStatusLabel = (systolic: number) => {
    if (systolic > 120) return "High";
    if (systolic < 90) return "Low";
    return "Normal";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h3" component="h1" fontWeight={700}>
            Blood Pressure Monitoring
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Reading
          </Button>
        </Box>

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FavoriteIcon color="primary" />
                    <Typography variant="h6">{statistics.total_readings}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Readings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUpIcon color="error" />
                    <Typography variant="h6">{statistics.high_risk_count}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    High Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Box sx={{ mb: 3, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
          {isMedicalStaff && (
            <TextField
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1 }}
            />
          )}
          <TextField
            type="date"
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={highRiskOnly ? "high-risk" : "all"}
              label="Filter"
              onChange={(e) => setHighRiskOnly(e.target.value === "high-risk")}
            >
              <MenuItem value="all">All Readings</MenuItem>
              <MenuItem value="high-risk">High Risk Only</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && readings.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <FavoriteIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Blood Pressure Readings Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              You may provide your blood pressure measurements. If we notice values outside the expected range, you'll receive personalized recommendations.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Keeping track of your blood pressure is really important - it helps you notice changes early and reduces the risk of heart and vascular problems.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Your First Reading
            </Button>
          </Paper>
        )}

        {/* Table */}
        {!isLoading && readings.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {isMedicalStaff && <TableCell>User</TableCell>}
                  <TableCell>Systolic</TableCell>
                  <TableCell>Diastolic</TableCell>
                  <TableCell>Reading</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id} hover>
                    {isMedicalStaff && (
                      <TableCell>
                        {reading.user_first_name} {reading.user_last_name}
                      </TableCell>
                    )}
                    <TableCell>{reading.systolic}</TableCell>
                    <TableCell>{reading.diastolic || "—"}</TableCell>
                    <TableCell>
                      <strong>
                        {reading.systolic}/{reading.diastolic || "—"}
                      </strong>{" "}
                      mmHg
                    </TableCell>
                    <TableCell>{formatDate(reading.reading_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(reading.systolic)}
                        color={getStatusColor(reading.systolic)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(reading.id)}
                        title="Delete reading"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Pagination */}
        {!isLoading && readings.length > 0 && (
          <PaginationControls
            totalPages={totalPages}
            currentPage={page}
            pageSize={pageSize}
            totalRecords={totalRecords}
            currentRecords={readings.length}
            itemName="readings"
            onPageChange={setPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setPage(1);
            }}
          />
        )}

        {/* Add Reading Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Add Blood Pressure Reading
              <IconButton onClick={() => setDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Systolic Pressure *"
                type="number"
                value={formData.systolic}
                onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                error={!!formErrors.systolic}
                helperText={formErrors.systolic || "Normal range: 90-120 mmHg"}
                slotProps={{ htmlInput: { min: 50, max: 300 } }}
                fullWidth
              />
              <TextField
                label="Diastolic Pressure"
                type="number"
                value={formData.diastolic}
                onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                error={!!formErrors.diastolic}
                helperText={formErrors.diastolic || "Normal range: 60-80 mmHg (optional)"}
                slotProps={{ htmlInput: { min: 30, max: 200 } }}
                fullWidth
              />
              <TextField
                label="Reading Date & Time"
                type="datetime-local"
                value={formData.reading_date}
                onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              {formErrors.submit && (
                <Alert severity="error">{formErrors.submit}</Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? "Adding..." : "Add Reading"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Blood Pressure Reading</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this blood pressure reading? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: "100%" }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default BloodPressure;
