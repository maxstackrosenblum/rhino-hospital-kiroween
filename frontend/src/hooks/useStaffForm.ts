import { useState, useCallback, ChangeEvent } from 'react';
import { useCreateReceptionist, useCreateWorker } from '../api/staff';
import { StaffCreate } from '../types';

export type StaffType = 'receptionists' | 'workers';

interface UseStaffFormReturn {
  formData: StaffCreate;
  errors: Record<string, string>;
  isSubmitting: boolean;
  handleChange: (field: keyof StaffCreate, value: string) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

const initialFormData: StaffCreate = {
  first_name: '',
  last_name: '',
  phone: '',
};

/**
 * Custom hook for managing staff registration form state and validation
 * Provides form data management, field-level validation, and submission handling
 * 
 * @param staffType - Type of staff ('receptionists' or 'workers')
 * @param onSuccess - Callback function to execute on successful form submission
 * @returns Object containing form state, validation errors, and form handlers
 */
export function useStaffForm(
  staffType: StaffType,
  onSuccess: () => void
): UseStaffFormReturn {
  const [formData, setFormData] = useState<StaffCreate>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Select the appropriate mutation hook based on staff type
  const createReceptionistMutation = useCreateReceptionist();
  const createWorkerMutation = useCreateWorker();
  
  const mutation = staffType === 'receptionists' ? createReceptionistMutation : createWorkerMutation;
  const isSubmitting = mutation.isPending;

  /**
   * Validate a single field
   * Returns error message if validation fails, empty string if valid
   */
  const validateField = useCallback((field: keyof StaffCreate, value: string): string => {
    // Check if field is empty or contains only whitespace
    if (!value || !value.trim()) {
      const fieldName = field.replace('_', ' ');
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }

    // Additional validation for phone field
    if (field === 'phone') {
      const trimmedValue = value.trim();
      if (trimmedValue.length < 10) {
        return 'Phone number must be at least 10 characters';
      }
    }

    // Additional validation for name fields
    if (field === 'first_name' || field === 'last_name') {
      const trimmedValue = value.trim();
      if (trimmedValue.length < 2) {
        const fieldName = field.replace('_', ' ');
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters`;
      }
    }

    return '';
  }, []);

  /**
   * Validate all form fields
   * Returns true if all fields are valid, false otherwise
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate each field
    (Object.keys(formData) as Array<keyof StaffCreate>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  /**
   * Handle input field changes
   * Updates form data and clears field-specific errors
   */
  const handleChange = useCallback((field: keyof StaffCreate, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Handle form submission
   * Validates form data and submits to API
   */
  const handleSubmit = useCallback(async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      // Trim all values before submission
      const trimmedData: StaffCreate = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
      };

      await mutation.mutateAsync(trimmedData);
      
      // Reset form and call success callback
      resetForm();
      onSuccess();
    } catch (error) {
      // Handle API errors
      if (error instanceof Error) {
        // Check if error contains field-specific validation errors
        const errorMessage = error.message;
        
        if (errorMessage.includes('first_name')) {
          setErrors((prev) => ({ ...prev, first_name: errorMessage }));
        } else if (errorMessage.includes('last_name')) {
          setErrors((prev) => ({ ...prev, last_name: errorMessage }));
        } else if (errorMessage.includes('phone')) {
          setErrors((prev) => ({ ...prev, phone: errorMessage }));
        } else {
          // General error
          setErrors({ general: transformErrorMessage(errorMessage) });
        }
      }
      throw error;
    }
  }, [formData, mutation, onSuccess, validateForm]);

  /**
   * Reset form to initial state
   * Clears all form data and errors
   */
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
  };
}

/**
 * Transform technical error messages into user-friendly messages
 */
function transformErrorMessage(message: string): string {
  if (message.includes('Failed to fetch') || message.includes('Network')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (message.includes('Authentication required') || message.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.';
  }
  
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'An unexpected error occurred. Please try again later.';
  }
  
  return message || 'An error occurred. Please try again.';
}
