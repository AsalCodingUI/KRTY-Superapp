/**
 * Public API for leave
 *
 * This file defines the public interface for this slice.
 * Only exports from this file should be imported by other slices.
 *
 * FSD Rule: Keep your public API minimal and stable.
 */

// UI Components
export {
  LEAVE_STATUS_VARIANT,
  LeaveBalance,
  LeaveCard,
  LeaveStatusBadge,
} from "./ui"

// Model (Types & Hooks)
export { useLeaveAdminStats, useLeaveBalance, useLeaveFilters } from "./model"
export type {
  LeaveFormData,
  LeaveRequest,
  LeaveRequestWithProfile,
  LeaveStats,
  LeaveStatus as LeaveStatusType,
  LeaveType,
} from "./model"

// API
export { getLeaveBalance, getLeaveRequestById, getLeaveRequests } from "./api"
