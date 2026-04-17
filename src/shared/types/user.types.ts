import { Database, Tables, TablesInsert, TablesUpdate } from "./database.types"

// --- Profiles ---
export type Profile = Tables<"profiles">
export type ProfileInsert = TablesInsert<"profiles">
export type ProfileUpdate = TablesUpdate<"profiles">

// --- Teams ---
export type Team = Tables<"teams">
export type TeamInsert = TablesInsert<"teams">
export type TeamUpdate = TablesUpdate<"teams">

// --- Enums ---
export type AppRole = Database["public"]["Enums"]["app_role"]
export type JobTitle = Database["public"]["Enums"]["job_title"]
