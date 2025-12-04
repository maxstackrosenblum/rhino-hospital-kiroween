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
  useMediaQuery,
  useTheme,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { AutoFixHigh as GenerateIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { AdminUserUpdate, User, UserCreate, UserRole } from "../../types";
import { generatePassword } from "../../utils/passwordGenerator";

interface UserFormProps<T extends "create" | "update"> {
  mode: T;
  initialData?: T extends "create" ? UserCreate : User;
  onSubmit: (data: T extends "create" ? UserCreate : AdminUserUpdate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  emailStatus?: {
    email_sent: boolean;
    email_error: string | null;
  } | null;
}

interface FormData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  age: string;
  address: string;
  gender: string;
  password: string;
  role: UserRole;
}

interface FormErrors {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  age?: string;
  address?: string;
  gender?: string;
  password?: string;
  role?: string;
}

const INITIAL_FORM_DATA: FormData = {
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  age: "",
  address: "",
  gender: "",
  password: "",
  role: "undefined",
};

function UserForm<T extends "create" | "update">({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
  emailStatus = null,
}: UserFormProps<T>) {
  const theme = useTheme();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [isPasswordGenerated, setIsPasswordGenerated] = useState(false);

  // Initialize form data when component mounts or initialData changes
  useEffect(() => {
    if (mode === "update" && initialData) {
      setFormData({
        email: initialData.email || "",
        username: "username" in initialData ? initialData.username || "" : "",
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        phone: initialData.phone || "",
        city: initialData.city || "",
        age: initialData.age != null ? initialData.age.toString() : "",
        address: initialData.address || "",
        gender: initialData.gender || "",
        password: "password" in initialData ? initialData.password || "" : "",
        role: initialData.role || "undefined",
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors({});
    setTouched({});
    setIsPasswordGenerated(false);
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

  const validateUsername = (username: string): string | undefined => {
    if (!username.trim()) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (!/^[A-Za-z0-9_-]+$/.test(username)) {
      return "Username can only contain letters, numbers, hyphens, and underscores";
    }
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

  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  const validateRole = (role: UserRole): string | undefined => {
    if (role === "undefined") return "Please select a role";
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

    // Always required fields
    newErrors.email = validateEmail(formData.email);
    newErrors.first_name = validateRequired(formData.first_name, "First name");
    newErrors.last_name = validateRequired(formData.last_name, "Last name");

    // Only validate username and password for create mode
    if (mode === "create") {
      newErrors.username = validateUsername(formData.username);
      newErrors.password = validatePassword(formData.password);
    }

    // Optional fields - only validate if they have values
    if (formData.phone.trim()) {
      newErrors.phone = validatePhone(formData.phone);
    }
    if (formData.city.trim()) {
      newErrors.city = validateRequired(formData.city, "City");
    }
    if (formData.age.trim()) {
      newErrors.age = validateAge(formData.age);
    }
    if (formData.address.trim()) {
      newErrors.address = validateRequired(formData.address, "Address");
    }
    if (formData.gender) {
      newErrors.gender = validateRequired(formData.gender, "Gender");
    }
    if (formData.role !== "undefined") {
      newErrors.role = validateRole(formData.role);
    }

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
      case "email":
        newErrors.email = validateEmail(formData.email);
        break;
      case "username":
        if (mode === "create") {
          newErrors.username = validateUsername(formData.username);
        }
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
      case "phone":
        // Only validate if field has content
        if (formData.phone.trim()) {
          newErrors.phone = validatePhone(formData.phone);
        }
        break;
      case "city":
        // Only validate if field has content
        if (formData.city.trim()) {
          newErrors.city = validateRequired(formData.city, "City");
        }
        break;
      case "age":
        // Only validate if field has content
        if (formData.age.trim()) {
          newErrors.age = validateAge(formData.age);
        }
        break;
      case "address":
        // Only validate if field has content
        if (formData.address.trim()) {
          newErrors.address = validateRequired(formData.address, "Address");
        }
        break;
      case "gender":
        // Only validate if field has content
        if (formData.gender) {
          newErrors.gender = validateRequired(formData.gender, "Gender");
        }
        break;
      case "password":
        if (mode === "create") {
          newErrors.password = validatePassword(formData.password);
        }
        break;
      case "role":
        // Only validate if role is not undefined
        if (formData.role !== "undefined") {
          newErrors.role = validateRole(formData.role);
        }
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
    if (mode === "create") {
      const submitData: UserCreate = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        // Optional fields - only include if they have values
        phone: formData.phone.trim() || undefined,
        city: formData.city.trim() || undefined,
        age: formData.age.trim() ? parseInt(formData.age) : undefined,
        address: formData.address.trim() || undefined,
        gender: formData.gender || undefined,
        role: formData.role !== "undefined" ? formData.role : undefined,
      };
      onSubmit(submitData as T extends "create" ? UserCreate : AdminUserUpdate);
    } else {
      const submitData: AdminUserUpdate = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        // Optional fields - only include if they have values
        phone: formData.phone.trim() || undefined,
        city: formData.city.trim() || undefined,
        age: formData.age.trim() ? parseInt(formData.age) : undefined,
        address: formData.address.trim() || undefined,
        gender: formData.gender || undefined,
        role: formData.role !== "undefined" ? formData.role : undefined,
      };
      onSubmit(submitData as T extends "create" ? UserCreate : AdminUserUpdate);
    }
  };

  // Handle password generation
  const handleGeneratePassword = async () => {
    setIsGeneratingPassword(true);
    try {
      const generated = generatePassword();
      setFormData((prev) => ({ ...prev, password: generated.password }));
      setIsPasswordGenerated(true);
      
      // Clear password error if it exists
      if (errors.password) {
        setErrors((prev) => ({ ...prev, password: undefined }));
      }
    } catch (error) {
      console.error("Failed to generate password:", error);
      // Could show an error message here
    } finally {
      setIsGeneratingPassword(false);
    }
  };

  // Password field is read-only - users can only generate passwords

  // Check if form is valid
  const isFormValid = Object.keys(validateForm()).length === 0;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      
      {/* Email Status Messages */}
      {emailStatus && (
        <>
          {emailStatus.email_sent ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Welcome email sent successfully to the user's email address with login credentials.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              User created successfully, but welcome email could not be sent. 
              {emailStatus.email_error && ` Error: ${emailStatus.email_error}`}
              <br />
              Please provide the login credentials to the user manually:
              <br />
              <strong>Username:</strong> {formData.username}
              <br />
              <strong>Password:</strong> {formData.password}
            </Alert>
          )}
        </>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Email and Username (username only for create mode) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <TextField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur("email")}
            error={touched.email && !!errors.email}
            helperText={touched.email && errors.email}
            size="small"
            fullWidth
            required
            disabled={isSubmitting}
          />
          {mode === "create" && (
            <TextField
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              onBlur={() => handleBlur("username")}
              error={touched.username && !!errors.username}
              helperText={
                touched.username && errors.username
                  ? errors.username
                  : "Unique username for login"
              }
              size="small"
              fullWidth
              required
              disabled={isSubmitting}
            />
          )}
        </Box>

        {/* Name Fields */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
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
            size="small"
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
            size="small"
            fullWidth
            required
            disabled={isSubmitting}
          />
        </Box>

        {/* Gender, Age, and Role */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <FormControl
            size="small"
            fullWidth
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
              <MenuItem value="">
                <em>Not specified</em>
              </MenuItem>
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
            size="small"
            fullWidth
            disabled={isSubmitting}
            slotProps={{
              htmlInput: { min: 0, max: 150 },
            }}
          />

          <FormControl
            size="small"
            fullWidth
            error={touched.role && !!errors.role}
            disabled={isSubmitting}
          >
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Role"
              onChange={(e) => handleSelectChange("role", e.target.value)}
              onBlur={() => handleBlur("role")}
            >
              <MenuItem value="undefined">
                <em>Not assigned</em>
              </MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="medical_staff">Medical Staff</MenuItem>
              <MenuItem value="receptionist">Receptionist</MenuItem>
              <MenuItem value="patient">Patient</MenuItem>
            </Select>
            {touched.role && errors.role && (
              <FormHelperText>{errors.role}</FormHelperText>
            )}
          </FormControl>
        </Box>

        {/* Contact Information */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
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
            size="small"
            fullWidth
            disabled={isSubmitting}
          />
          <TextField
            name="city"
            label="City"
            value={formData.city}
            onChange={handleChange}
            onBlur={() => handleBlur("city")}
            error={touched.city && !!errors.city}
            helperText={touched.city && errors.city}
            size="small"
            fullWidth
            disabled={isSubmitting}
          />
        </Box>

        {/* Address */}
        <TextField
          name="address"
          label="Address"
          value={formData.address}
          onChange={handleChange}
          onBlur={() => handleBlur("address")}
          error={touched.address && !!errors.address}
          helperText={touched.address && errors.address}
          size="small"
          fullWidth
          multiline
          rows={3}
          disabled={isSubmitting}
        />

        {/* Password (only for create mode) */}
        {mode === "create" && (
          <Box>
            <TextField
              name="password"
              label="Password"
              type={isPasswordGenerated ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              error={touched.password && !!errors.password}
              helperText={
                touched.password && errors.password
                  ? errors.password
                  : isPasswordGenerated
                  ? "Secure password generated. Click 'Generate New' to create a different one."
                  : "Use the Generate Password button to create a secure password"
              }
              size="small"
              fullWidth
              required
              disabled={true}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleGeneratePassword}
                      disabled={isSubmitting || isGeneratingPassword}
                      edge="end"
                      title="Generate secure password"
                    >
                      <GenerateIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': {
                  cursor: 'default',
                },
              }}
            />
          </Box>
        )}

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
              ? "Create User"
              : "Update User"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default UserForm;
