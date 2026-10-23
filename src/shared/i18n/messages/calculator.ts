/** "calculator" strings. `id` is the source of truth; `en` must have every key. */
const id = {
  pageTitle: "Kalkulator",

  // Calculation header
  calculationHeading: "Kalkulasi",
  titleLabel: "Judul",
  untitledCalculation: "Kalkulasi Tanpa Judul",
  projectLabel: "Project",
  selectProject: "Pilih project…",
  newCalculation: "Baru",
  newPhase: "Fase Baru",

  // Saved calculations
  savedCalculations: "Kalkulasi Tersimpan",
  savedEmptyTitle: "Belum ada kalkulasi tersimpan",
  savedEmptyDescription:
    "Kalkulasi yang disimpan untuk project ini akan muncul di sini.",
  load: "Muat",

  // Toasts
  toastMemberAlreadyAdded: "Anggota sudah ditambahkan!",
  toastClearCostsFailed:
    "Gagal menghapus biaya yang ada. Tidak ada data yang berubah.",
  toastImportFailed:
    "Impor gagal: {message}. Biaya sebelumnya sudah dipulihkan secara lokal — muat ulang halaman untuk sinkron dengan server.",
  toastImported: "{count} item biaya berhasil diimpor",
  toastSaved: "Kalkulasi tersimpan",
  toastSaveFailed: "Gagal menyimpan",
  toastLoaded: "Kalkulasi dimuat",
  toastDeleted: "Kalkulasi dihapus",
  toastDeleteFailed: "Gagal menghapus kalkulasi",

  // Dialogs
  replaceCostsTitle: "Ganti Biaya Operasional?",
  replaceCostsDescription:
    "Impor akan mengganti semua biaya operasional yang ada. Tindakan ini tidak bisa dibatalkan. Lanjutkan?",
  importConfirm: "Impor",
  deleteCalculationTitle: "Hapus Kalkulasi?",
  deleteCalculationDescription:
    "Kalkulasi ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.",

  // Project context
  projectContext: "Konteks Project",
  revenueUsd: "Pendapatan (USD)",
  exchangeRateIdr: "Kurs (IDR)",
  dailyWorkload: "Beban Kerja Harian (Jam)",
  targetMarginPercent: "Target Margin (%)",
  examplePlaceholder: "mis. {value}",

  // Timeline
  timelineEngine: "Timeline",
  totalDays: "Total: {count} hari",
  phaseName: "Nama Fase",
  days: "Hari",
  buffer: "Buffer",
  addProjectPhase: "Tambah Fase Project",

  // Squad
  squadAllocation: "Alokasi Tim",
  selectTeamMember: "Pilih anggota tim…",
  allocation: "Alokasi",
  noTeamMembersAllocated: "Belum ada anggota tim yang dialokasikan.",

  // Freelance
  freelanceHeading: "Freelance / COGS (Opsional)",
  addFreelance: "Tambah Freelance",
  fullName: "Nama Lengkap",
  role: "Peran",
  totalFeeIdr: "Total Fee (IDR)",
  notesOptional: "Catatan (opsional)",
  freelanceNotesPlaceholder: "mis. khusus untuk ilustrasi",
  noFreelanceCosts: "Belum ada biaya freelance.",

  // Operational costs
  operationalCosts: "Biaya Operasional",
  operationalCostsDescription:
    "Alokasi overhead bulanan yang dipakai untuk project ini.",
  downloadCsvTemplate: "Unduh Template CSV",
  downloadJsonTemplate: "Unduh Template JSON",
  exportCsv: "Ekspor CSV",
  exportJson: "Ekspor JSON",
  importCosts: "Impor Biaya",
  noOperationalCosts: "Belum ada biaya operasional yang dimuat.",

  // Financial HUD
  financialOverview: "Ringkasan Keuangan",
  netProfit: "Laba Bersih",
  marginBadge: "Margin {value}%",
  grossRevenue: "Pendapatan Kotor",
  laborCost: "Biaya Tenaga Kerja (Gaji)",
  overheadPortion: "Overhead (Porsi)",
  cogsFreelance: "COGS (Freelance)",
  totalCost: "Total Biaya",
  currentMargin: "Margin Saat Ini",
  pricingSuggestion: "Saran Harga",
  breakEvenPrice: "Harga Impas",
  suggestedPrice: "Harga Saran (margin {value}%)",
  marginHealthy: "Margin memenuhi target. Harga terlihat sehat.",
  marginBelowTarget:
    "Margin di bawah target. Pertimbangkan menyesuaikan scope atau harga.",
}

const en: Record<keyof typeof id, string> = {
  pageTitle: "Calculator",

  calculationHeading: "Calculation",
  titleLabel: "Title",
  untitledCalculation: "Untitled Calculation",
  projectLabel: "Project",
  selectProject: "Select project…",
  newCalculation: "New",
  newPhase: "New Phase",

  savedCalculations: "Saved Calculations",
  savedEmptyTitle: "No saved calculations yet",
  savedEmptyDescription:
    "Calculations saved for this project will show up here.",
  load: "Load",

  toastMemberAlreadyAdded: "Member already added!",
  toastClearCostsFailed: "Failed to clear existing costs. No data was changed.",
  toastImportFailed:
    "Import failed: {message}. Previous costs have been restored locally — please refresh to sync with the server.",
  toastImported: "Imported {count} cost items",
  toastSaved: "Calculation saved",
  toastSaveFailed: "Failed to save",
  toastLoaded: "Calculation loaded",
  toastDeleted: "Calculation deleted",
  toastDeleteFailed: "Failed to delete calculation",

  replaceCostsTitle: "Replace Operational Costs?",
  replaceCostsDescription:
    "Importing will replace all existing operational costs. This action cannot be undone. Continue?",
  importConfirm: "Import",
  deleteCalculationTitle: "Delete Calculation?",
  deleteCalculationDescription:
    "This calculation will be permanently deleted. This action cannot be undone.",

  projectContext: "Project Context",
  revenueUsd: "Revenue (USD)",
  exchangeRateIdr: "Exchange Rate (IDR)",
  dailyWorkload: "Daily Workload (Hours)",
  targetMarginPercent: "Target Margin (%)",
  examplePlaceholder: "e.g. {value}",

  timelineEngine: "Timeline Engine",
  totalDays: "Total: {count} days",
  phaseName: "Phase Name",
  days: "Days",
  buffer: "Buffer",
  addProjectPhase: "Add Project Phase",

  squadAllocation: "Squad Allocation",
  selectTeamMember: "Select team member…",
  allocation: "Allocation",
  noTeamMembersAllocated: "No team members allocated yet.",

  freelanceHeading: "Freelance / COGS (Optional)",
  addFreelance: "Add Freelance",
  fullName: "Full Name",
  role: "Role",
  totalFeeIdr: "Total Fee (IDR)",
  notesOptional: "Notes (optional)",
  freelanceNotesPlaceholder: "e.g. scoped for illustration",
  noFreelanceCosts: "No freelance costs added.",

  operationalCosts: "Operational Costs",
  operationalCostsDescription:
    "Monthly overhead allocation used for this project.",
  downloadCsvTemplate: "Download CSV Template",
  downloadJsonTemplate: "Download JSON Template",
  exportCsv: "Export CSV",
  exportJson: "Export JSON",
  importCosts: "Import Costs",
  noOperationalCosts: "No operational costs loaded yet.",

  financialOverview: "Financial Overview",
  netProfit: "Net Profit",
  marginBadge: "{value}% Margin",
  grossRevenue: "Gross Revenue",
  laborCost: "Labor Cost (Salary)",
  overheadPortion: "Overhead (Portion)",
  cogsFreelance: "COGS (Freelance)",
  totalCost: "Total Cost",
  currentMargin: "Current Margin",
  pricingSuggestion: "Pricing Suggestion",
  breakEvenPrice: "Break-even Price",
  suggestedPrice: "Suggested Price ({value}% margin)",
  marginHealthy: "Margin meets target. Pricing looks healthy.",
  marginBelowTarget:
    "Margin is below target. Consider adjusting scope or price.",
}

export const calculator = { id, en }
