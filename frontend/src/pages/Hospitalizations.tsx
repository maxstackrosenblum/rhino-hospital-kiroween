import {
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDoctors } from "../api/doctors";
import {
  useCreateHospitalization,
  useDeleteHospitalization,
  useHospitalizations,
  useUpdateHospitalization,
} from "../api/hospitalizations";
import { usePatients } from "../api/patients";
import {
  HospitalizationsStack,
  HospitalizationsTable,
} from "../components/hospitalizations";
import {
  Hospitalization,
  HospitalizationCreate,
  HospitalizationUpdate,
  Patient,
  User,
} from "../types";
import { PaginationControls } from "../components/common";

interface HospitalizationsProps {
  user: User;
}

function Hospitalizations({ user }: HospitalizationsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHospitalization, setEditingHospitalization] =
    useState<Hospitalization | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hospitalizationToDelete, setHospitalizationToDelete] =
    useState<Hospitalization | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "my-patients"
  >(user.role === "doctor" ? "my-patients" : "active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    if (
      !["admin", "doctor", "medical_staff", "receptionist"].includes(user.role)
    ) {
      navigate("/");
    }
  }, [user, navigate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  const {
    data: hospitalizationsResponse,
    isLoading,
    error,
  } = useHospitalizations({
    page,
    page_size: pageSize,
    search: searchTerm,
    active_only: filterStatus === "active",
  });

  const allHospitalizations = hospitalizationsResponse?.hospitalizations || [];
  const totalPages = hospitalizationsResponse?.total_pages || 0;
  const totalRecords = hospitalizationsResponse?.total || 0;
  const { data: patientsResponse, isLoading: patientsLoading } = usePatients({
    search: patientSearch,
    page_size: 50,
  });
  const { data: doctorsResponse } = useDoctors({ page_size: 100 });
  const doctors = doctorsResponse?.doctors || [];
  const allPatients = Array.isArray(patientsResponse)
    ? patientsResponse
    : patientsResponse?.patients || (patientsResponse as any)?.items || [];
  // Filter to only show patients with complete profiles (id is not null)
  const patients = allPatients.filter((p: any) => p.id !== null);

  // Find current user's doctor ID if they're a doctor
  const currentDoctor = doctors.find((d) => d.user_id === user.id);

  // Client-side filtering for "my-patients" (server handles active_only and search)
  const hospitalizations =
    filterStatus === "my-patients" && currentDoctor
      ? allHospitalizations.filter(
          (h) =>
            !h.discharge_date &&
            h.doctors?.some((d) => d.id === currentDoctor.id)
        )
      : allHospitalizations;

  const createMutation = useCreateHospitalization();
  const updateMutation = useUpdateHospitalization();
  const deleteMutation = useDeleteHospitalization();

  const handleOpenDialog = (hospitalization?: Hospitalization) => {
    if (hospitalization) {
      setEditingHospitalization(hospitalization);
      setFormData({
        patient_id: hospitalization.patient_id.toString(),
        admission_date: hospitalization.admission_date.split("T")[0],
        discharge_date: hospitalization.discharge_date
          ? hospitalization.discharge_date.split("T")[0]
          : "",
        diagnosis: hospitalization.diagnosis,
        summary: hospitalization.summary || "",
        doctor_ids: hospitalization.doctors?.map((d) => d.id) || [],
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
      alert(
        "Selected patient does not have a complete profile. Please complete their patient profile first."
      );
      return;
    }

    const data: HospitalizationCreate | HospitalizationUpdate = {
      ...(editingHospitalization ? {} : { patient_id: patientId }),
      admission_date: new Date(formData.admission_date).toISOString(),
      ...(formData.discharge_date && {
        discharge_date: new Date(formData.discharge_date).toISOString(),
      }),
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

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setHospitalizationToDelete(null);
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h3" component="h1" fontWeight={700}>
            Hospitalizations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Hospitalization
          </Button>
        </Box>

        {/* Search Bar and Filter */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by patient name..."
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
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterStatus}
              label="Filter"
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "active" | "my-patients"
                )
              }
            >
              {user.role === "doctor" && (
                <MenuItem value="my-patients">My Patients</MenuItem>
              )}
              <MenuItem value="active">Active Hospitalizations</MenuItem>
              <MenuItem value="all">All Hospitalizations</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load hospitalizations
          </Alert>
        )}

        {/* Hospitalizations Display - Table for desktop, Stack for mobile */}
        {isMobile ? (
          <HospitalizationsStack
            hospitalizations={hospitalizations}
            searchTerm={searchTerm}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />
        ) : (
          <HospitalizationsTable
            hospitalizations={hospitalizations}
            searchTerm={searchTerm}
            isLoading={isLoading}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />
        )}

        {/* Pagination Controls */}
        <PaginationControls
          totalPages={totalPages}
          currentPage={page}
          pageSize={pageSize}
          totalRecords={totalRecords}
          currentRecords={hospitalizations.length}
          itemName="hospitalizations"
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
        />

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingHospitalization
              ? "Edit Hospitalization"
              : "Add Hospitalization"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              {!editingHospitalization && (
                <Autocomplete
                  options={patients}
                  loading={patientsLoading}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.last_name} - ${option.email}`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.user_id === value.user_id
                  }
                  value={selectedPatient}
                  onChange={(_, newValue) => setSelectedPatient(newValue)}
                  onInputChange={(_, newInputValue) =>
                    setPatientSearch(newInputValue)
                  }
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
                  noOptionsText={
                    patientsLoading ? "Loading..." : "No patients found"
                  }
                  fullWidth
                />
              )}
              <TextField
                label="Admission Date"
                type="date"
                value={formData.admission_date}
                onChange={(e) =>
                  setFormData({ ...formData, admission_date: e.target.value })
                }
                required
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
              <TextField
                label="Discharge Date"
                type="date"
                value={formData.discharge_date}
                onChange={(e) =>
                  setFormData({ ...formData, discharge_date: e.target.value })
                }
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
              <TextField
                label="Diagnosis"
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                required
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
              />
              <Autocomplete
                multiple
                options={doctors}
                getOptionLabel={(option) =>
                  `Dr. ${option.first_name} ${option.last_name}${
                    option.specialization ? ` - ${option.specialization}` : ""
                  }`
                }
                value={doctors.filter(
                  (d) => d.id && formData.doctor_ids.includes(d.id)
                )}
                onChange={(_, newValue) => {
                  setFormData({
                    ...formData,
                    doctor_ids: newValue
                      .map((d) => d.id!)
                      .filter((id) => id !== null),
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Doctors"
                    placeholder="Select doctors"
                    helperText="Optional: Select one or more doctors"
                  />
                )}
                slotProps={{
                  chip: {
                    color: "primary",
                    variant: "outlined",
                  },
                }}
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Hospitalization?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this hospitalization record?
              {hospitalizationToDelete && (
                <>
                  <br />
                  <br />
                  <strong>Patient:</strong> {hospitalizationToDelete.patient_first_name}{" "}
                  {hospitalizationToDelete.patient_last_name}
                  <br />
                  <strong>Admission Date:</strong>{" "}
                  {new Date(hospitalizationToDelete.admission_date).toLocaleDateString()}
                </>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
