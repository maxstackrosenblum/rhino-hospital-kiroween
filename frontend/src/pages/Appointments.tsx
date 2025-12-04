import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentsApi, Appointment, AvailableDoctor } from "../api/appointments";
import { usePatients } from "../api/patients";
import LoadingSpinner from "../components/LoadingSpinner";
import { PaginationControls } from "../components/common";
import { User, Patient } from "../types";

interface AppointmentsProps {
  user: User;
}

const Appointments: React.FC<AppointmentsProps> = ({ user }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // List state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]); // Today by default
  const [dateTo, setDateTo] = useState("");
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [disease, setDisease] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Fetch patients for search
  const { data: patientsResponse, isLoading: patientsLoading } = usePatients({
    search: patientSearch,
    page_size: 50,
  });
  
  const allPatients = Array.isArray(patientsResponse)
    ? patientsResponse
    : patientsResponse?.patients || (patientsResponse as any)?.items || [];
  const patients = allPatients.filter((p: any) => p.id !== null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, selectedPatient, dateFrom, dateTo]);

  useEffect(() => {
    fetchAppointments();
  }, [page, statusFilter, selectedPatient, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableDoctors();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);


  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentsApi.getAll({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        patient_id: selectedPatient?.id || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setAppointments(response.appointments);
      setTotalPages(response.total_pages);
      setTotalRecords(response.total);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDoctors = async () => {
    setLoadingDoctors(true);
    setErrorMessage("");
    try {
      const response = await appointmentsApi.getAvailableDoctors(selectedDate);
      setAvailableDoctors(response.available_doctors);
      setSelectedDoctor(null);
      setAvailableSlots([]);
      setSelectedSlot("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load available doctors");
      setAvailableDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor) return;
    
    setLoadingSlots(true);
    setErrorMessage("");
    try {
      const response = await appointmentsApi.getDoctorAvailableSlots(selectedDoctor, selectedDate);
      if (response.has_shift) {
        setAvailableSlots(response.available_slots);
      } else {
        setAvailableSlots([]);
        setErrorMessage("Doctor has no shift on this date");
      }
      setSelectedSlot("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load available slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedDate("");
    setAvailableDoctors([]);
    setSelectedDoctor(null);
    setAvailableSlots([]);
    setSelectedSlot("");
    setDisease("");
    setErrorMessage("");
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedSlot || !disease.trim()) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await appointmentsApi.create({
        doctor_id: selectedDoctor,
        appointment_date: selectedSlot,
        disease: disease.trim(),
      });
      
      setSuccessMessage("Appointment booked successfully!");
      setDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setDeleteDialogOpen(true);
  };

  const handleCancelDialogClose = () => {
    setDeleteDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;

    try {
      await appointmentsApi.delete(appointmentToCancel.id);
      setSuccessMessage("Appointment cancelled successfully");
      setDeleteDialogOpen(false);
      setAppointmentToCancel(null);
      fetchAppointments();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to cancel appointment");
      setDeleteDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleStatusClick = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setNewStatus(appointment.status);
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setAppointmentToEdit(null);
    setNewStatus("");
  };

  const handleStatusUpdate = async () => {
    if (!appointmentToEdit || !newStatus) return;

    try {
      await appointmentsApi.updateStatus(appointmentToEdit.id, { status: newStatus as any });
      setSuccessMessage("Appointment status updated successfully");
      setStatusDialogOpen(false);
      setAppointmentToEdit(null);
      setNewStatus("");
      fetchAppointments();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update status");
      setStatusDialogOpen(false);
      setAppointmentToEdit(null);
      setNewStatus("");
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Appointments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Book Appointment
        </Button>
      </Box>

      {/* Search Bar, Filter, and Date Range */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        {/* Patient Search - Only for doctors and admins */}
        {["admin", "doctor"].includes(user.role) ? (
          <Autocomplete
            sx={{ flex: 1, minWidth: 250 }}
            options={patients}
            getOptionLabel={(option: any) =>
              `${option.first_name} ${option.last_name}${
                option.medical_record_number ? ` (${option.medical_record_number})` : ""
              }`
            }
            value={selectedPatient}
            onChange={(_, newValue) => setSelectedPatient(newValue)}
            onInputChange={(_, newInputValue) => setPatientSearch(newInputValue)}
            loading={patientsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by patient name..."
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        ) : (
          <Box sx={{ flex: 1, minWidth: 250 }} />
        )}

        {/* Status Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        {/* Date From */}
        <TextField
          label="From Date"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
          }}
          sx={{ width: 160 }}
        />

        {/* Date To */}
        <TextField
          label="To Date"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
          }}
          sx={{ width: 160 }}
        />
      </Box>

      {/* Appointments Table */}
      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No appointments found
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  {["admin", "doctor"].includes(user.role) && (
                    <TableCell>Patient</TableCell>
                  )}
                  <TableCell>Doctor</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDateTime(appointment.appointment_date)}</TableCell>
                    {["admin", "doctor"].includes(user.role) && (
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {appointment.patient_first_name} {appointment.patient_last_name}
                          </Typography>
                          {appointment.patient_age && (
                            <Typography variant="caption" color="text.secondary">
                              Age: {appointment.patient_age}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                        </Typography>
                        {appointment.doctor_specialization && (
                          <Typography variant="caption" color="text.secondary">
                            {appointment.doctor_specialization}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{appointment.doctor_department || "-"}</TableCell>
                    <TableCell>{appointment.disease}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                        />
                        {["admin", "doctor"].includes(user.role) && 
                         appointment.status !== "cancelled" && 
                         appointment.status !== "completed" && (
                          <IconButton
                            size="small"
                            onClick={() => handleStatusClick(appointment)}
                            title="Edit status"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelClick(appointment)}
                          title="Cancel appointment"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </Box>
          )}
        </>
      )}


      {/* Book Appointment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Book Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today }}
              fullWidth
              required
            />

            {selectedDate && (
              <FormControl fullWidth required>
                <InputLabel>Select Doctor</InputLabel>
                <Select
                  value={selectedDoctor || ""}
                  label="Select Doctor"
                  onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                  disabled={loadingDoctors}
                >
                  {loadingDoctors ? (
                    <MenuItem value="">Loading doctors...</MenuItem>
                  ) : availableDoctors.length > 0 ? (
                    availableDoctors.map((doctor) => (
                      <MenuItem key={doctor.doctor_id} value={doctor.doctor_id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                        {doctor.specialization && ` - ${doctor.specialization}`}
                        {doctor.department && ` (${doctor.department})`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No doctors available on this date
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {selectedDoctor && (
              <FormControl fullWidth required>
                <InputLabel>Select Time Slot</InputLabel>
                <Select
                  value={selectedSlot}
                  label="Select Time Slot"
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  disabled={loadingSlots}
                >
                  {loadingSlots ? (
                    <MenuItem value="">Loading slots...</MenuItem>
                  ) : availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {formatTime(slot)}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No available time slots
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Reason for Visit"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              multiline
              rows={4}
              placeholder="Describe your symptoms or reason for visit"
              fullWidth
              required
            />

            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage("")}>
                {errorMessage}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !selectedSlot || !disease.trim()}
          >
            {submitting ? "Booking..." : "Book Appointment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage && !dialogOpen}
        autoHideDuration={6000}
        onClose={() => setErrorMessage("")}
      >
        <Alert severity="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Appointment?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this appointment?
          </Typography>
          {appointmentToCancel && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDateTime(appointmentToCancel.appointment_date)}
              </Typography>
              <Typography variant="body2">
                <strong>Doctor:</strong> Dr. {appointmentToCancel.doctor_first_name}{" "}
                {appointmentToCancel.doctor_last_name}
              </Typography>
              <Typography variant="body2">
                <strong>Reason:</strong> {appointmentToCancel.disease}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose}>No, Keep It</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            Yes, Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Edit Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleStatusDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Appointment Status</DialogTitle>
        <DialogContent>
          {appointmentToEdit && (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Patient:</strong> {appointmentToEdit.patient_first_name}{" "}
                  {appointmentToEdit.patient_last_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDateTime(appointmentToEdit.appointment_date)}
                </Typography>
                <Typography variant="body2">
                  <strong>Current Status:</strong>{" "}
                  <Chip
                    label={appointmentToEdit.status}
                    color={getStatusColor(appointmentToEdit.status) as any}
                    size="small"
                  />
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  label="New Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus || newStatus === appointmentToEdit?.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Appointments;
