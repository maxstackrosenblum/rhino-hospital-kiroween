import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { MedicalStaff, MedicalStaffCreate, MedicalStaffUpdate } from "../../types";

interface MedicalStaffFormProps {
  mode: "profile" | "update";
  initialData?: MedicalStaff;
  onSubmit: (data: MedicalStaffCreate | MedicalStaffUpdate) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

function MedicalStaffForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: MedicalStaffFormProps) {
  const [formData, setFormData] = useState({
    job_title: initialData?.job_title || "",
    department: initialData?.department || "",
    shift_schedule: initialData?.shift_schedule || "",
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        job_title: initialData.job_title || "",
        department: initialData.department || "",
        shift_schedule: initialData.shift_schedule || "",
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "profile") {
      // For profile completion, we need user_id
      if (!initialData?.user_id) return;
      
      onSubmit({
        user_id: initialData.user_id,
        job_title: formData.job_title || undefined,
        department: formData.department || undefined,
        shift_schedule: formData.shift_schedule || undefined,
      } as MedicalStaffCreate);
    } else {
      // For update, only send changed fields
      const updateData: MedicalStaffUpdate = {};
      if (formData.job_title !== initialData?.job_title) {
        updateData.job_title = formData.job_title || undefined;
      }
      if (formData.department !== initialData?.department) {
        updateData.department = formData.department || undefined;
      }
      if (formData.shift_schedule !== initialData?.shift_schedule) {
        updateData.shift_schedule = formData.shift_schedule || undefined;
      }
      onSubmit(updateData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {submitError}
        </Alert>
      )}

      <TextField
        label="Job Title"
        value={formData.job_title}
        onChange={(e) => handleChange("job_title", e.target.value)}
        fullWidth
        disabled={isSubmitting}
        placeholder="e.g., Nurse, Technician"
      />

      <TextField
        label="Department"
        value={formData.department}
        onChange={(e) => handleChange("department", e.target.value)}
        fullWidth
        disabled={isSubmitting}
        placeholder="e.g., Emergency, Surgery"
      />

      <TextField
        label="Shift Schedule"
        value={formData.shift_schedule}
        onChange={(e) => handleChange("shift_schedule", e.target.value)}
        fullWidth
        disabled={isSubmitting}
        placeholder="e.g., Monday-Friday 9AM-5PM"
        multiline
        rows={2}
      />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting
            ? mode === "profile"
              ? "Completing..."
              : "Updating..."
            : mode === "profile"
            ? "Complete Profile"
            : "Update"}
        </Button>
      </Box>
    </Box>
  );
}

export default MedicalStaffForm;
