import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Patient } from "../../types";

interface PatientFormProps {
  mode: "create" | "update";
  initialData?: Patient;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

interface FormData {
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  city: string;
  email: string;
  age: string;
  address: string;
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
};

function PatientForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}: PatientFormProps) {
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

    newErrors.first_name = validateRequired(formData.first_name, "First name");
    newErrors.last_name = validateRequired(formData.last_name, "Last name");
    newErrors.gender = validateRequired(formData.gender, "Gender");
    newErrors.phone = validatePhone(formData.phone);
    newErrors.city = validateRequired(formData.city, "City");
    newErrors.email = validateEmail(formData.email);
    newErrors.age = validateAge(formData.age);
    newErrors.address = validateRequired(formData.address, "Address");

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

  // Handle field blur (for showing validation errors)
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Validate this specific field
    const newErrors = { ...errors };
    switch (fieldName) {
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

    // Convert form data to appropriate type
    const submitData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      gender: formData.gender,
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      email: formData.email.trim(),
      age: parseInt(formData.age),
      address: formData.address.trim(),
    };

    onSubmit(submitData);
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
        {/* Name Fields */}
        <Box sx={{ display: "flex", gap: 2 }}>
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
          />
        </Box>

        {/* Gender and Age */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl
            fullWidth
            required
            error={touched.gender && !!errors.gender}
            disabled={isSubmitting}
          >
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={(e) => handleSelectChange("gender", e.target.value)}
              onBlur={() => handleBlur("gender")}
            >
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
            required
            disabled={isSubmitting}
            slotProps={{
              htmlInput: { min: 0, max: 150 },
            }}
          />
        </Box>

        {/* Contact Information */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur("phone")}
            error={touched.phone && !!errors.phone}
            helperText={touched.phone && errors.phone}
            fullWidth
            required
            disabled={isSubmitting}
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
          required
          disabled={isSubmitting}
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
          required
          disabled={isSubmitting}
        />

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}
        >
          <Button onClick={onCancel} disabled={isSubmitting} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Patient"
              : "Update Patient"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default PatientForm;
