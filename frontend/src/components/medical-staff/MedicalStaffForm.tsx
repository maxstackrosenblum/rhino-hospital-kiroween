import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import {
  MedicalStaff,
  MedicalStaffCreate,
  MedicalStaffUpdate,
} from "../../types";

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

  const [errors, setErrors] = useState({
    job_title: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        job_title: initialData.job_title || "",
        department: initialData.department || "",
        shift_schedule: initialData.shift_schedule || "",
      });
    }
    // Clear errors and touched state when form resets
    setErrors({ job_title: "" });
    setTouched({});
  }, [initialData]);

  // Parse API validation errors and map them to form fields
  useEffect(() => {
    if (submitError) {
      const apiErrors = { job_title: "" };

      // Try to parse field-specific errors from the API error message
      if (submitError.includes("job_title")) {
        apiErrors.job_title = "Job title is required";
      } else if (submitError.toLowerCase().includes("job title")) {
        apiErrors.job_title = submitError;
      }

      if (apiErrors.job_title) {
        setErrors(apiErrors);
        // Mark field with API error as touched so it shows
        setTouched((prev) => ({ ...prev, job_title: true }));
      }
    }
  }, [submitError]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (field === "job_title" && errors.job_title) {
      setErrors((prev) => ({ ...prev, job_title: "" }));
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Validate this specific field
    const newErrors = { ...errors };
    if (fieldName === "job_title") {
      newErrors.job_title = !formData.job_title.trim()
        ? "Job title is required"
        : "";
    }
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = { job_title: "" };

    if (!formData.job_title.trim()) {
      newErrors.job_title = "Job title is required";
    }

    setErrors(newErrors);
    return !newErrors.job_title;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    if (mode === "profile") {
      // For profile completion, we need user_id
      if (!initialData?.user_id) return;

      onSubmit({
        user_id: initialData.user_id,
        job_title: formData.job_title.trim(),
        department: formData.department.trim() || undefined,
        shift_schedule: formData.shift_schedule.trim() || undefined,
      } as MedicalStaffCreate);
    } else {
      // For update, always include job_title since it's required
      const updateData: MedicalStaffUpdate = {
        job_title: formData.job_title.trim(),
      };

      // Only include other fields if they've changed
      if (formData.department.trim() !== initialData?.department) {
        updateData.department = formData.department.trim() || undefined;
      }
      if (formData.shift_schedule.trim() !== initialData?.shift_schedule) {
        updateData.shift_schedule = formData.shift_schedule.trim() || undefined;
      }

      onSubmit(updateData);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {submitError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {submitError}
        </Alert>
      )}

      <TextField
        label="Job Title"
        value={formData.job_title}
        onChange={(e) => handleChange("job_title", e.target.value)}
        onBlur={() => handleBlur("job_title")}
        fullWidth
        required
        disabled={isSubmitting}
        placeholder="e.g., Nurse, Technician"
        error={!!(touched.job_title && errors.job_title)}
        helperText={touched.job_title && errors.job_title}
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
          disabled={isSubmitting || !formData.job_title.trim()}
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
