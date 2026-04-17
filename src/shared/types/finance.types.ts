import { Database, Tables, TablesInsert, TablesUpdate } from "./database.types"

// --- Project Invoices ---
export type ProjectInvoice = Tables<"project_invoices">
export type ProjectInvoiceInsert = TablesInsert<"project_invoices">
export type ProjectInvoiceUpdate = TablesUpdate<"project_invoices">

// --- Payment Methods ---
export type PaymentMethod = Tables<"payment_methods">
export type PaymentMethodInsert = TablesInsert<"payment_methods">
export type PaymentMethodUpdate = TablesUpdate<"payment_methods">

// --- Operational Costs ---
export type OperationalCost = Tables<"operational_costs">
export type OperationalCostInsert = TablesInsert<"operational_costs">
export type OperationalCostUpdate = TablesUpdate<"operational_costs">

// --- Enums ---
export type OperationalCostCategory = Database["public"]["Enums"]["operational_cost_category"]
export type CurrencyOriginalEnum = Database["public"]["Enums"]["currency_original_enum"]
