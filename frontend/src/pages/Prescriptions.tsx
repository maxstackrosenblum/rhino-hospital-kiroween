import {
  Add as AddIcon,
  Delete as DeleteIcon,
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
  IconButton,
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
import { useHospitalizations } from "../api/hospitalizations";
import { usePatients } from "../api/patients";
import {
  useCreatePrescription,
  useDeletePrescription,
  usePrescriptions,
  useUpdatePrescription,
} from "../api/prescriptions";
import {
  PrescriptionsStack,
  PrescriptionsTable,
} from "../components/prescriptions";
import { PaginationControls } from "../components/common";
import {
  MedicineItem,
  Patient,
  Prescription,
  PrescriptionCreate,
  User,
} from "../types";

interface PrescriptionsProps {
  user: User;
}

function Prescriptions({ user }: PrescriptionsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] =
    useState<Prescription | null>(null);
  const [prescriptionToDelete, setPrescriptionToDelete] =
    useState<Prescription | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dateError, setDateError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "hospitalized" | "my-patients"
  >(user.role === "doctor" ? "my-patients" : "hospitalized");
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [formData, setFormData] = useState({
    patient_id: "",
    date: "",
    start_date: "",
    end_date: "",
    medicines: [{ name: "", dosage: "", frequency: "", duration: "" }],
  });

  const canWrite = ["admin", "doctor"].includes(user.role);

  useEffect(() => {
    if (!["admin", "doctor", "medical_staff"].includes(user.role)) {
      navigate("/");
    }
  }, [user, navigate]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate, filterStatus]);

  const {
    data: prescriptionsResponse,
    isLoading,
    error,
  } = usePrescriptions({
    page,
    page_size: pageSize,
    search: searchTerm,
    start_date: startDate,
    end_date: endDate,
  });

  const allPrescriptions = prescriptionsResponse?.prescriptions || [];
  const totalPages = prescriptionsResponse?.total_pages || 0;
  const totalRecords = prescriptionsResponse?.total || 0;

  const { data: patientsResponse, isLoading: patientsLoading } = usePatients({
    search: patientSearch,
    page_size: 50,
  });
  const { data: hospitalizationsResponse } = useHospitalizations({
    page_size: 100,
  });
  const hospitalizations = hospitalizationsResponse?.hospitalizations || [];
  const { data: doctorsResponse } = useDoctors({ page_size: 100 });
  const doctors = doctorsResponse?.doctors || [];
  const allPatients = Array.isArray(patientsResponse)
    ? patientsResponse
    : patientsResponse?.patients || (patientsResponse as any)?.items || [];
  // Filter to only show patients with complete profiles (id is not null)
  const patients = allPatients.filter((p: any) => p.id !== null);

  // Find current user's doctor ID if they're a doctor
  const currentDoctor = doctors.find((d) => d.user_id === user.id);

  // Get hospitalized patient IDs
  const hospitalizedPatientIds = new Set(
    hospitalizations.filter((h) => !h.discharge_date).map((h) => h.patient_id)
  );

  // Get my patient IDs (for doctors)
  const myPatientIds = new Set(
    currentDoctor
      ? hospitalizations
          .filter(
            (h) =>
              !h.discharge_date &&
              h.doctors?.some((d) => d.id === currentDoctor.id)
          )
          .map((h) => h.patient_id)
      : []
  );

  // Client-side filtering for status (hospitalized/my-patients)
  // Server already handles search, date range via API
  const prescriptions =
    filterStatus === "hospitalized"
      ? allPrescriptions.filter((p) => hospitalizedPatientIds.has(p.patient_id))
      : filterStatus === "my-patients" && currentDoctor
      ? allPrescriptions.filter((p) => myPatientIds.has(p.patient_id))
      : allPrescriptions;

  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();
  const deleteMutation = useDeletePrescription();

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [
        ...formData.medicines,
        { name: "", dosage: "", frequency: "", duration: "" },
      ],
    });
  };

  const removeMedicine = (index: number) => {
    if (formData.medicines.length > 1) {
      setFormData({
        ...formData,
        medicines: formData.medicines.filter((_, i) => i !== index),
      });
    }
  };

  const handleMedicineChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const handleOpenDialog = (prescription?: Prescription) => {
    if (prescription) {
      // Editing existing prescription
      setEditingPrescription(prescription);
      setFormData({
        patient_id: prescription.patient_id.toString(),
        date: prescription.date.split("T")[0],
        start_date: "",
        end_date: "",
        medicines: prescription.medicines.map((m) => ({
          name: m.name || "",
          dosage: m.dosage || "",
          frequency: m.frequency || "",
          duration: m.duration || "",
        })),
      });
      setSelectedPatient(null);
    } else {
      // Creating new prescription
      setEditingPrescription(null);
      setFormData({
        patient_id: "",
        date: "",
        start_date: "",
        end_date: "",
        medicines: [{ name: "", dosage: "", frequency: "", duration: "" }],
      });
      setSelectedPatient(null);
      setPatientSearch("");
    }
    setDateError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPrescription(null);
  };

  const validateDatesAgainstHospitalization = (
    patientId: number,
    startDate: string,
    endDate: string
  ): string | null => {
    const patientHospitalizations = hospitalizations.filter(
      (h) => h.patient_id === patientId
    );

    if (patientHospitalizations.length === 0) {
      return "Warning: Patient has no hospitalization records. Prescriptions should be given during hospitalization.";
    }

    // Normalize dates to start of day for comparison (ignore time component)
    const prescriptionStart = new Date(startDate);
    prescriptionStart.setHours(0, 0, 0, 0);
    const prescriptionEnd = new Date(endDate);
    prescriptionEnd.setHours(23, 59, 59, 999);

    // Check if prescription dates fall within any hospitalization period
    const isWithinHospitalization = patientHospitalizations.some((h) => {
      const admissionDate = new Date(h.admission_date);
      admissionDate.setHours(0, 0, 0, 0);

      // If still admitted (no discharge date), use far future date
      const dischargeDate = h.discharge_date
        ? new Date(h.discharge_date)
        : new Date("2099-12-31");
      dischargeDate.setHours(23, 59, 59, 999);

      return (
        prescriptionStart >= admissionDate && prescriptionEnd <= dischargeDate
      );
    });

    if (!isWithinHospitalization) {
      const activeHospitalization = patientHospitalizations.find(
        (h) => !h.discharge_date
      );
      if (activeHospitalization) {
        const admissionDate = new Date(
          activeHospitalization.admission_date
        ).toLocaleDateString();
        return `Prescription dates must fall within hospitalization period (admitted: ${admissionDate}, currently active).`;
      } else {
        return "Prescription dates must fall within a hospitalization period. Patient is not currently hospitalized.";
      }
    }

    return null;
  };

  const handleSubmit = () => {
    const medicines: MedicineItem[] = formData.medicines
      .filter((m) => m.name.trim()) // Only include medicines with names
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim() || undefined,
        frequency: m.frequency.trim() || undefined,
        duration: m.duration.trim() || undefined,
      }));

    if (medicines.length === 0) {
      setDateError("Please add at least one medicine");
      return;
    }

    if (editingPrescription) {
      // Update existing prescription
      updateMutation.mutate(
        {
          id: editingPrescription.id,
          data: {
            start_date: new Date(formData.date).toISOString(),
            end_date: new Date(formData.date).toISOString(),
            medicines,
          },
        },
        {
          onSuccess: () => {
            setSuccessMessage("Prescription updated successfully!");
            handleCloseDialog();
          },
        }
      );
    } else {
      // Create new prescription
      if (!selectedPatient) return;

      if (!selectedPatient.id) {
        setDateError(
          "Selected patient does not have a complete profile. Please complete their patient profile first."
        );
        return;
      }

      const validationError = validateDatesAgainstHospitalization(
        selectedPatient.id,
        formData.start_date,
        formData.end_date
      );

      if (validationError) {
        setDateError(validationError);
        return;
      }

      const data: PrescriptionCreate = {
        patient_id: selectedPatient.id!,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        medicines,
      };

      createMutation.mutate(data, {
        onSuccess: (response) => {
          setSuccessMessage(
            `Created ${response.created_count} prescription(s) successfully!`
          );
          handleCloseDialog();
        },
      });
    }
  };

  const handleDeleteClick = (prescription: Prescription) => {
    setPrescriptionToDelete(prescription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPrescriptionToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!prescriptionToDelete) return;

    deleteMutation.mutate(prescriptionToDelete.id, {
      onSuccess: () => {
        setSuccessMessage("Prescription deleted successfully!");
        setDeleteDialogOpen(false);
        setPrescriptionToDelete(null);
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
            Prescriptions
          </Typography>
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Prescription
            </Button>
          )}
        </Box>

        {/* Search Bar, Filter, and Date Range */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <TextField
            sx={{ flex: 1, minWidth: 250 }}
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
                  e.target.value as "all" | "hospitalized" | "my-patients"
                )
              }
            >
              {user.role === "doctor" && (
                <MenuItem value="my-patients">My Patients</MenuItem>
              )}
              <MenuItem value="hospitalized">Active Hospitalizations</MenuItem>
              <MenuItem value="all">All Prescriptions</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            sx={{ width: 160 }}
          />
          <TextField
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            sx={{ width: 160 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load prescriptions
          </Alert>
        )}

        {/* Prescriptions Display - Table for desktop, Stack for mobile */}
        {isMobile ? (
          <PrescriptionsStack
            prescriptions={prescriptions}
            searchTerm={searchTerm}
            isLoading={isLoading}
            canWrite={canWrite}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />
        ) : (
          <PrescriptionsTable
            prescriptions={prescriptions}
            searchTerm={searchTerm}
            isLoading={isLoading}
            canWrite={canWrite}
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
          currentRecords={prescriptions.length}
          itemName="prescriptions"
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
            {editingPrescription ? "Edit Prescription" : "Add Prescription"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              {!editingPrescription && (
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
                  onChange={(_, newValue) => {
                    setSelectedPatient(newValue);
                    setDateError("");
                  }}
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
              {dateError && (
                <Alert severity="error" onClose={() => setDateError("")}>
                  {dateError}
                </Alert>
              )}
              {editingPrescription ? (
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              ) : (
                <>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    helperText="First day of prescription period"
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    helperText="Last day of prescription period"
                  />
                </>
              )}
              {/* Medicines Array */}
              <Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Typography variant="h6">Medicines</Typography>
                  <IconButton
                    onClick={addMedicine}
                    size="small"
                    color="primary"
                    title="Add another medicine"
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                {formData.medicines.map((medicine, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Medicine {index + 1}
                      </Typography>
                      {formData.medicines.length > 1 && (
                        <IconButton
                          onClick={() => removeMedicine(index)}
                          size="small"
                          color="error"
                          title="Remove medicine"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        label="Medicine Name"
                        value={medicine.name}
                        onChange={(e) =>
                          handleMedicineChange(index, "name", e.target.value)
                        }
                        required
                        fullWidth
                        size="small"
                        placeholder="e.g., Amoxicillin"
                      />
                      <TextField
                        label="Dosage"
                        value={medicine.dosage}
                        onChange={(e) =>
                          handleMedicineChange(index, "dosage", e.target.value)
                        }
                        fullWidth
                        size="small"
                        placeholder="e.g., 500mg"
                      />
                      <TextField
                        label="Frequency"
                        value={medicine.frequency}
                        onChange={(e) =>
                          handleMedicineChange(
                            index,
                            "frequency",
                            e.target.value
                          )
                        }
                        fullWidth
                        size="small"
                        placeholder="e.g., twice daily"
                      />
                      <TextField
                        label="Duration"
                        value={medicine.duration}
                        onChange={(e) =>
                          handleMedicineChange(
                            index,
                            "duration",
                            e.target.value
                          )
                        }
                        fullWidth
                        size="small"
                        placeholder="e.g., 7 days"
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
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
                (!editingPrescription && !selectedPatient)
              }
            >
              {editingPrescription ? "Update" : "Create"}
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
          <DialogTitle>Delete Prescription?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this prescription?
              {prescriptionToDelete && (
                <>
                  <br />
                  <br />
                  <strong>Patient:</strong>{" "}
                  {prescriptionToDelete.patient_first_name}{" "}
                  {prescriptionToDelete.patient_last_name}
                  <br />
                  <strong>Date:</strong>{" "}
                  {new Date(prescriptionToDelete.date).toLocaleDateString()}
                  <br />
                  <strong>Medicines:</strong>{" "}
                  {prescriptionToDelete.medicines.length} item(s)
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

export default Prescriptions;
