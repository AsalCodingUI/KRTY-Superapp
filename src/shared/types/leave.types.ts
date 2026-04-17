import { Database, Tables, TablesInsert, TablesUpdate } from "./database.types"

export type LeaveRequest = Tables<"leave_requests">
export type LeaveRequestInsert = TablesInsert<"leave_requests">
export type LeaveRequestUpdate = TablesUpdate<"leave_requests">

export type RequestStatus = Database["public"]["Enums"]["request_status"]
