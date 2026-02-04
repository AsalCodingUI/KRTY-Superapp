import { LeaveFormData } from "./useLeaveRequestForm"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateLeaveRequest(
  formData: LeaveFormData,
): ValidationResult {
  const errors: string[] = []

  if (!formData.start_date) {
    errors.push("Start date is required")
  }

  if (!formData.end_date) {
    errors.push("End date is required")
  }

  if (
    formData.start_date &&
    formData.end_date &&
    formData.start_date > formData.end_date
  ) {
    errors.push("End date must be after start date")
  }

  if (!formData.reason || formData.reason.trim().length === 0) {
    errors.push("Reason is required")
  }

  if (formData.reason && formData.reason.trim().length < 10) {
    errors.push("Reason must be at least 10 characters")
  }

  if (!formData.leave_type) {
    errors.push("Leave type is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
