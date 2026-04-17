import { Tables, TablesInsert, TablesUpdate } from "./database.types"

// --- Notifications ---
export type Notification = Tables<"notifications">
export type NotificationInsert = TablesInsert<"notifications">
export type NotificationUpdate = TablesUpdate<"notifications">

// --- Role Page Defaults ---
export type RolePageDefault = Tables<"role_page_defaults">
export type RolePageDefaultInsert = TablesInsert<"role_page_defaults">
export type RolePageDefaultUpdate = TablesUpdate<"role_page_defaults">

// --- User Page Permissions ---
export type UserPagePermission = Tables<"user_page_permissions">
export type UserPagePermissionInsert = TablesInsert<"user_page_permissions">
export type UserPagePermissionUpdate = TablesUpdate<"user_page_permissions">
