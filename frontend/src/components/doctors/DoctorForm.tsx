import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Doctor, DoctorProfileCreate, DoctorUpdate } from "../../types";

interface DoctorFormProps {
  mode: "profile" | "update";
  initialData?: Doctor;
  onSubmit: (data: DoctorProfileCreate | DoctorUpdate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

interface FormData {
  // User fields (for update mode)
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  city: string;
  email: string;
  age: string;
  address: string;
  // Doctor-specific fields
  doctor_id: string;
  qualifications: string[];
  department: string;
  specialization: string;
  license_number: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  gender?: string;
  phone?: string;
  city?: string;
  email?: string;
  age?: string;
  address?: string;
  doctor_id?: string;
  qualifications?: string;
  department?: string;
  specialization?: string;
  license_number?: string;
}

const INITIAL_FORM_DATA: FormData = {
  first_name: "",
  last_name: "",
  gender: "",
  phone: "",
  city: "",
  email: "",
  age: "",
  address: "",
  doctor_id: "",
  qualifications: [""],
  department: "",
  specialization: "",
  license_number: "",
};

function DoctorForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}: DoctorFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when component mounts or initialData changes
  useEffect(() => {
    if (mode === "update" && initialData) {
      setFormData({
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        gender: initialData.gender,
        phone: initialData.phone,
        city: initialData.city,
        email: initialData.email,
        age: initialData.age.toString(),
        address: initialData.address,
        doctor_id: initialData.doctor_id || "",
        qualifications:
          initialData.qualifications && initialData.qualifications.length > 0
            ? initialData.qualifications
            : [""],
        department: initialData.department || "",
        specialization: initialData.specialization || "",
        license_number: initialData.license_number || "",
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors({});
    setTouched({});
  }, [mode, initialData]);

  // Parse API validation errors and map them to form fields
  useEffect(() => {
    if (submitError) {
      const apiErrors: FormErrors = {};

      // Try to parse field-specific errors from the API error message
      if (submitError.includes(":")) {
        const errorParts = submitError.split(", ");
        errorParts.forEach((part) => {
          const [field, message] = part.split(": ", 2);
          if (field && message && field in INITIAL_FORM_DATA) {
            apiErrors[field as keyof FormErrors] = message;
          }
        });

        if (Object.keys(apiErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...apiErrors }));
          // Mark fields with API errors as touched so they show
          const touchedFields = Object.keys(apiErrors).reduce((acc, field) => {
            acc[field] = true;
            return acc;
          }, {} as Record<string, boolean>);
          setTouched((prev) => ({ ...prev, ...touchedFields }));
        }
      }
    }
  }, [submitError]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return "Phone number is required";
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return "Please enter a valid phone number";
    }
    return undefined;
  };

  const validateAge = (age: string): string | undefined => {
    if (!age.trim()) return "Age is required";
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return "Age must be a number";
    if (ageNum < 0) return "Age cannot be negative";
    if (ageNum > 150) return "Age cannot be greater than 150";
    return undefined;
  };

  const validateDoctorId = (doctorId: string): string | undefined => {
    if (!doctorId.trim()) return "Doctor ID is required";
    if (doctorId.length < 3) return "Doctor ID must be at least 3 characters";
    if (!/^[A-Za-z0-9_-]+$/.test(doctorId)) {
      return "Doctor ID can only contain letters, numbers, hyphens, and underscores";
    }
    return undefined;
  };

  const validateQualifications = (
    qualifications: string[]
  ): string | undefined => {
    const nonEmptyQualifications = qualifications.filter((q) => q.trim());
    if (nonEmptyQualifications.length === 0)
      return "At least one qualification is required";
    return undefined;
  };

  const validateRequired = (
    value: string,
    fieldName: string
  ): string | undefined => {
    if (!value.trim()) return `${fieldName} is required`;
    return undefined;
  };

  // Validate all fields
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // For profile mode, only validate doctor-specific fields
    // For update mode, validate required fields (first_name, last_name, email are database constraints)
    if (mode === "update") {
      // These fields are required at database level (nullable=False)
      newErrors.first_name = validateRequired(
        formData.first_name,
        "First name"
      );
      newErrors.last_name = validateRequired(formData.last_name, "Last name");
      if (formData.phone.trim()) {
        newErrors.phone = validatePhone(formData.phone);
      }
      // Email is always required (database constraint)
      newErrors.email = validateEmail(formData.email);
      if (formData.age.trim()) {
        newErrors.age = validateAge(formData.age);
      }
      // Gender, city, and address are optional in update mode
    }

    // Doctor-specific fields validation (only required in profile mode)
    if (mode === "profile") {
      newErrors.doctor_id = validateDoctorId(formData.doctor_id);
      newErrors.qualifications = validateQualifications(
        formData.qualifications
      );
    } else {
      // In update mode, only validate if values are provided
      if (formData.doctor_id.trim()) {
        newErrors.doctor_id = validateDoctorId(formData.doctor_id);
      }
      if (formData.qualifications.some((q) => q.trim())) {
        newErrors.qualifications = validateQualifications(
          formData.qualifications
        );
      }
    }

    // Optional fields - no validation needed for department, specialization, license_number

    // Remove undefined errors
    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key as keyof FormErrors]) {
        delete newErrors[key as keyof FormErrors];
      }
    });

    return newErrors;
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user makes selection
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle qualifications array changes
  const handleQualificationChange = (index: number, value: string) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = value;
    setFormData((prev) => ({ ...prev, qualifications: newQualifications }));

    // Clear error for qualifications when user starts typing
    if (errors.qualifications) {
      setErrors((prev) => ({ ...prev, qualifications: undefined }));
    }
  };

  // Add new qualification field
  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, ""],
    }));
  };

  // Remove qualification field
  const removeQualification = (index: number) => {
    if (formData.qualifications.length > 1) {
      const newQualifications = formData.qualifications.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({ ...prev, qualifications: newQualifications }));
    }
  };

  // Handle field blur (for showing validation errors)
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Validate this specific field
    const newErrors = { ...errors };
    switch (fieldName) {
      case "doctor_id":
        newErrors.doctor_id = validateDoctorId(formData.doctor_id);
        break;
      case "first_name":
        newErrors.first_name = validateRequired(
          formData.first_name,
          "First name"
        );
        break;
      case "last_name":
        newErrors.last_name = validateRequired(formData.last_name, "Last name");
        break;
      case "gender":
        newErrors.gender = validateRequired(formData.gender, "Gender");
        break;
      case "phone":
        newErrors.phone = validatePhone(formData.phone);
        break;
      case "city":
        newErrors.city = validateRequired(formData.city, "City");
        break;
      case "email":
        newErrors.email = validateEmail(formData.email);
        break;
      case "age":
        newErrors.age = validateAge(formData.age);
        break;
      case "address":
        newErrors.address = validateRequired(formData.address, "Address");
        break;
      case "qualifications":
        newErrors.qualifications = validateQualifications(
          formData.qualifications
        );
        break;
      case "department":
        // Optional field, no validation needed
        break;
      case "specialization":
        // Optional field, no validation needed
        break;
      case "license_number":
        // Optional field, no validation needed
        break;
    }
    setErrors(newErrors);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    // If there are errors, don't submit
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    // Convert form data to appropriate type based on mode
    const qualifications = formData.qualifications
      .filter((q) => q.trim())
      .map((q) => q.trim());

    if (mode === "profile") {
      // Profile completion - only doctor-specific fields
      const submitData: DoctorProfileCreate = {
        doctor_id: formData.doctor_id.trim(),
        qualifications,
        department: formData.department.trim() || undefined,
        specialization: formData.specialization.trim() || undefined,
        license_number: formData.license_number.trim() || undefined,
      };
      onSubmit(submitData);
    } else {
      // Update mode - all fields
      const submitData: DoctorUpdate = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        email: formData.email.trim(),
        age: parseInt(formData.age),
        address: formData.address.trim(),
        doctor_id: formData.doctor_id.trim(),
        qualifications,
        department: formData.department.trim() || undefined,
        specialization: formData.specialization.trim() || undefined,
        license_number: formData.license_number.trim() || undefined,
      };
      onSubmit(submitData);
    }
  };

  // Check if form is valid
  const isFormValid = Object.keys(validateForm()).length === 0;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* User Fields - Only show in update mode */}
        {mode === "update" && (
          <>
            {/* Name Fields */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
              }}
            >
              <TextField
                name="first_name"
                label="First Name"
                value={formData.first_name}
                onChange={handleChange}
                onBlur={() => handleBlur("first_name")}
                error={touched.first_name && !!errors.first_name}
                helperText={touched.first_name && errors.first_name}
                fullWidth
                required
                disabled={isSubmitting}
                size="small"
              />
              <TextField
                name="last_name"
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                onBlur={() => handleBlur("last_name")}
                error={touched.last_name && !!errors.last_name}
                helperText={touched.last_name && errors.last_name}
                fullWidth
                required
                disabled={isSubmitting}
                size="small"
              />
            </Box>

            {/* Gender and Age */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
              }}
            >
              <FormControl
                fullWidth
                error={touched.gender && !!errors.gender}
                disabled={isSubmitting}
                size="small"
              >
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => handleSelectChange("gender", e.target.value)}
                  onBlur={() => handleBlur("gender")}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {touched.gender && errors.gender && (
                  <FormHelperText>{errors.gender}</FormHelperText>
                )}
              </FormControl>

              <TextField
                name="age"
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                onBlur={() => handleBlur("age")}
                error={touched.age && !!errors.age}
                helperText={touched.age && errors.age}
                fullWidth
                disabled={isSubmitting}
                size="small"
                slotProps={{
                  htmlInput: { min: 0, max: 150 },
                }}
              />
            </Box>

            {/* Contact Information */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
              }}
            >
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur("phone")}
                error={touched.phone && !!errors.phone}
                helperText={touched.phone && errors.phone}
                fullWidth
                disabled={isSubmitting}
                size="small"
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                error={touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                fullWidth
                required
                disabled={isSubmitting}
                size="small"
              />
            </Box>

            {/* City */}
            <TextField
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              onBlur={() => handleBlur("city")}
              error={touched.city && !!errors.city}
              helperText={touched.city && errors.city}
              fullWidth
              disabled={isSubmitting}
              size="small"
            />

            {/* Address */}
            <TextField
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              onBlur={() => handleBlur("address")}
              error={touched.address && !!errors.address}
              helperText={touched.address && errors.address}
              fullWidth
              multiline
              rows={3}
              disabled={isSubmitting}
              size="small"
            />
          </>
        )}

        {/* Doctor-Specific Fields */}
        <TextField
          name="doctor_id"
          label="Doctor ID"
          value={formData.doctor_id}
          onChange={handleChange}
          onBlur={() => handleBlur("doctor_id")}
          error={touched.doctor_id && !!errors.doctor_id}
          helperText={
            touched.doctor_id && errors.doctor_id
              ? errors.doctor_id
              : "Unique identifier for the doctor (e.g., DOC001, dr_smith)"
          }
          fullWidth
          required
          disabled={isSubmitting}
          size="small"
        />

        {/* Qualifications Array */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" component="label">
              Qualifications *
            </Typography>
            <IconButton
              onClick={addQualification}
              disabled={isSubmitting}
              size="small"
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Box>
          {formData.qualifications.map((qualification, index) => (
            <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                label={`Qualification ${index + 1}`}
                value={qualification}
                onChange={(e) =>
                  handleQualificationChange(index, e.target.value)
                }
                onBlur={() => handleBlur("qualifications")}
                error={touched.qualifications && !!errors.qualifications}
                fullWidth
                disabled={isSubmitting}
                placeholder="e.g., MBBS, MD, PhD"
                size="small"
              />
              {formData.qualifications.length > 1 && (
                <IconButton
                  onClick={() => removeQualification(index)}
                  disabled={isSubmitting}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
          {touched.qualifications && errors.qualifications && (
            <FormHelperText error sx={{ ml: 2 }}>
              {errors.qualifications}
            </FormHelperText>
          )}
        </Box>

        {/* Department and Specialization */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <TextField
            name="department"
            label="Department"
            value={formData.department}
            onChange={handleChange}
            onBlur={() => handleBlur("department")}
            error={touched.department && !!errors.department}
            helperText={
              touched.department && errors.department
                ? errors.department
                : "Optional: Medical department (e.g., Cardiology, Neurology)"
            }
            fullWidth
            disabled={isSubmitting}
            size="small"
          />
          <TextField
            name="specialization"
            label="Specialization"
            value={formData.specialization}
            onChange={handleChange}
            onBlur={() => handleBlur("specialization")}
            error={touched.specialization && !!errors.specialization}
            helperText={
              touched.specialization && errors.specialization
                ? errors.specialization
                : "Optional: Area of specialization"
            }
            fullWidth
            disabled={isSubmitting}
            size="small"
          />
        </Box>

        {/* License Number */}
        <TextField
          name="license_number"
          label="License Number"
          value={formData.license_number}
          onChange={handleChange}
          onBlur={() => handleBlur("license_number")}
          error={touched.license_number && !!errors.license_number}
          helperText={
            touched.license_number && errors.license_number
              ? errors.license_number
              : "Optional: Medical license number"
          }
          fullWidth
          disabled={isSubmitting}
          size="small"
        />

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "flex-end",
            mt: 2,
          }}
        >
          <Button
            onClick={onCancel}
            disabled={isSubmitting}
            variant="outlined"
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isFormValid}
            fullWidth={isMobile}
          >
            {isSubmitting
              ? mode === "profile"
                ? "Completing Profile..."
                : "Updating..."
              : mode === "profile"
              ? "Complete Profile"
              : "Update Doctor"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default DoctorForm;
