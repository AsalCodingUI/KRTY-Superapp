import { Tables, TablesInsert, TablesUpdate } from "./database.types"

export type AttendanceLog = Tables<"attendance_logs">
export type AttendanceLogInsert = TablesInsert<"attendance_logs">
export type AttendanceLogUpdate = TablesUpdate<"attendance_logs">
