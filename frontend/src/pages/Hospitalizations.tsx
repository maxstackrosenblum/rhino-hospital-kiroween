import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
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
import {
  useCreateHospitalization,
  useDeleteHospitalization,
  useHospitalizations,
  useUpdateHospitalization,
} from "../api/hospitalizations";
import { usePatients } from "../api/patients";
import { useDoctors } from "../api/doctors";
import { Hospitalization, HospitalizationCreate, HospitalizationUpdate, Patient, User } from "../types";

interface HospitalizationsProps {
  user: User;
}

function Hospitalizations({ user }: HospitalizationsProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingHospitalization, setEditingHospitalization] = useState<Hospitalization | null>(null);
  const [hospitalizationToDelete, setHospitalizationToDelete] = useState<Hospitalization | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    patient_id: "",
    admission_date: "",
    discharge_date: "",
    diagnosis: "",
    summary: "",
    doctor_ids: [] as number[],
  });

  // Check permissions
  useEffect(() => {
    if (!["admin", "doctor", "medical_staff", "receptionist"].includes(user.role)) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: hospitalizations = [], isLoading, error } = useHospitalizations();
  const { data: patientsResponse, isLoading: patientsLoading } = usePatients({ 
    search: patientSearch, 
    page_size: 50 
  });
  const { data: doctorsResponse } = useDoctors({ page_size: 100 });
  const doctors = doctorsResponse?.doctors || [];
  const allPatients = Array.isArray(patientsResponse) 
    ? patientsResponse 
    : (patientsResponse?.patients || patientsResponse?.items || []);
  // Filter to only show patients with complete profiles (id is not null)
  const patients = allPatients.filter(p => p.id !== null);
  const createMutation = useCreateHospitalization();
  const updateMutation = useUpdateHospitalization();
  const deleteMutation = useDeleteHospitalization();

  const handleOpenDialog = (hospitalization?: Hospitalization) => {
    if (hospitalization) {
      setEditingHospitalization(hospitalization);
      setFormData({
        patient_id: hospitalization.patient_id.toString(),
        admission_date: hospitalization.admission_date.split('T')[0],
        discharge_date: hospitalization.discharge_date ? hospitalization.discharge_date.split('T')[0] : "",
        diagnosis: hospitalization.diagnosis,
        summary: hospitalization.summary || "",
        doctor_ids: hospitalization.doctors?.map(d => d.id) || [],
      });
      setSelectedPatient(null);
    } else {
      setEditingHospitalization(null);
      setFormData({
        patient_id: "",
        admission_date: "",
        discharge_date: "",
        diagnosis: "",
        summary: "",
        doctor_ids: [],
      });
      setSelectedPatient(null);
      setPatientSearch("");
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHospitalization(null);
  };

  const handleSubmit = () => {
    // For new hospitalizations, use the patient's id (from patients table)
    const patientId = editingHospitalization 
      ? parseInt(formData.patient_id) 
      : selectedPatient?.id;

    if (!patientId) {
      alert("Selected patient does not have a complete profile. Please complete their patient profile first.");
      return;
    }

    const data: HospitalizationCreate | HospitalizationUpdate = {
      ...(editingHospitalization ? {} : { patient_id: patientId }),
      admission_date: new Date(formData.admission_date).toISOString(),
      ...(formData.discharge_date && { discharge_date: new Date(formData.discharge_date).toISOString() }),
      diagnosis: formData.diagnosis,
      ...(formData.summary && { summary: formData.summary }),
      doctor_ids: formData.doctor_ids,
    };

    if (editingHospitalization) {
      updateMutation.mutate(
        { id: editingHospitalization.id, data: data as HospitalizationUpdate },
        {
          onSuccess: () => {
            setSuccessMessage("Hospitalization updated successfully!");
            handleCloseDialog();
          },
        }
      );
    } else {
      createMutation.mutate(data as HospitalizationCreate, {
        onSuccess: () => {
          setSuccessMessage("Hospitalization created successfully!");
          handleCloseDialog();
        },
      });
    }
  };

  const handleDeleteClick = (hospitalization: Hospitalization) => {
    setHospitalizationToDelete(hospitalization);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!hospitalizationToDelete) return;

    deleteMutation.mutate(hospitalizationToDelete.id, {
      onSuccess: () => {
        setSuccessMessage("Hospitalization deleted successfully!");
        setDeleteDialogOpen(false);
        setHospitalizationToDelete(null);
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h3" component="h1" fontWeight={700}>
            Hospitalizations
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Hospitalization
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load hospitalizations
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Admission Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Discharge Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Diagnosis</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Doctors</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Summary</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : hospitalizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" color="text.secondary">
                      No hospitalizations found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hospitalizations.map((hospitalization) => (
                  <TableRow key={hospitalization.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {hospitalization.patient_first_name} {hospitalization.patient_last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Age: {hospitalization.patient_age} • ID: {hospitalization.patient_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(hospitalization.admission_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {hospitalization.discharge_date
                        ? new Date(hospitalization.discharge_date).toLocaleDateString()
                        : "Active"}
                    </TableCell>
                    <TableCell>{hospitalization.diagnosis}</TableCell>
                    <TableCell>
                      {hospitalization.doctors && hospitalization.doctors.length > 0 ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {hospitalization.doctors.map((doctor) => (
                            <Chip
                              key={doctor.id}
                              label={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No doctors assigned</Typography>
                      )}
                    </TableCell>
                    <TableCell>{hospitalization.summary || "-"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton onClick={() => handleOpenDialog(hospitalization)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(hospitalization)} color="error" size="small">
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

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingHospitalization ? "Edit Hospitalization" : "Add Hospitalization"}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              {!editingHospitalization && (
                <Autocomplete
                  options={patients}
                  loading={patientsLoading}
                  getOptionLabel={(option) => 
                    `${option.first_name} ${option.last_name} - ${option.email}`
                  }
                  isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
                  value={selectedPatient}
                  onChange={(_, newValue) => setSelectedPatient(newValue)}
                  onInputChange={(_, newInputValue) => setPatientSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Patient"
                      placeholder="Search by name or email"
                      required
                      helperText="Type to search for a patient"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.user_id}>
                      <Box>
                        <Typography variant="body1">
                          {option.first_name} {option.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText={patientsLoading ? "Loading..." : "No patients found"}
                  fullWidth
                />
              )}
              <TextField
                label="Admission Date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Discharge Date"
                type="date"
                value={formData.discharge_date}
                onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <Autocomplete
                multiple
                options={doctors}
                getOptionLabel={(option) => 
                  `Dr. ${option.first_name} ${option.last_name}${option.specialization ? ` - ${option.specialization}` : ''}`
                }
                value={doctors.filter(d => d.id && formData.doctor_ids.includes(d.id))}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, doctor_ids: newValue.map(d => d.id!).filter(id => id !== null) });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Doctors"
                    placeholder="Select doctors"
                    helperText="Optional: Select one or more doctors"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={`Dr. ${option.first_name} ${option.last_name}`}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={
                createMutation.isPending || 
                updateMutation.isPending ||
                (!editingHospitalization && !selectedPatient)
              }
            >
              {editingHospitalization ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Hospitalization?</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this hospitalization record?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending}>
              Delete
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
          <Alert onClose={() => setSuccessMessage("")} severity="success">
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default Hospitalizations;
