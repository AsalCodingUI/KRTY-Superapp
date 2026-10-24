/** "calculator" strings. `id` is the source of truth; `en` must have every key. */
const id = {
  pageTitle: "Kalkulator",

  // Calculation header
  calculationHeading: "Kalkulasi",
  titleLabel: "Judul",
  untitledCalculation: "Kalkulasi tanpa judul",
  projectLabel: "Project",
  selectProject: "Pilih project…",
  newCalculation: "Baru",
  newPhase: "Fase baru",

  // Saved calculations
  savedCalculations: "Kalkulasi tersimpan",
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
  replaceCostsTitle: "Ganti biaya operasional?",
  replaceCostsDescription:
    "Impor akan mengganti semua biaya operasional yang ada. Tindakan ini tidak bisa dibatalkan. Lanjutkan?",
  importConfirm: "Impor",
  deleteCalculationTitle: "Hapus kalkulasi?",
  deleteCalculationDescription:
    "Kalkulasi ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.",

  // Project context
  projectContext: "Konteks project",
  revenueUsd: "Pendapatan (USD)",
  exchangeRateIdr: "Kurs (IDR)",
  dailyWorkload: "Beban kerja harian (jam)",
  targetMarginPercent: "Target margin (%)",
  examplePlaceholder: "mis. {value}",

  // Timeline
  timelineEngine: "Timeline",
  totalDays: "Total: {count} hari",
  phaseName: "Nama fase",
  days: "Hari",
  buffer: "Buffer",
  addProjectPhase: "Tambah fase project",

  // Squad
  squadAllocation: "Alokasi tim",
  selectTeamMember: "Pilih anggota tim…",
  allocation: "Alokasi",
  noTeamMembersAllocated: "Belum ada anggota tim yang dialokasikan.",

  // Freelance
  freelanceHeading: "Freelance / COGS (opsional)",
  addFreelance: "Tambah freelance",
  fullName: "Nama lengkap",
  role: "Peran",
  totalFeeIdr: "Total fee (IDR)",
  notesOptional: "Catatan (opsional)",
  freelanceNotesPlaceholder: "mis. khusus untuk ilustrasi",
  noFreelanceCosts: "Belum ada biaya freelance.",

  // Operational costs
  operationalCosts: "Biaya operasional",
  operationalCostsDescription:
    "Alokasi overhead bulanan yang dipakai untuk project ini.",
  downloadCsvTemplate: "Unduh template CSV",
  downloadJsonTemplate: "Unduh template JSON",
  exportCsv: "Ekspor CSV",
  exportJson: "Ekspor JSON",
  importCosts: "Impor biaya",
  noOperationalCosts: "Belum ada biaya operasional yang dimuat.",

  // Financial HUD
  financialOverview: "Ringkasan keuangan",
  netProfit: "Laba bersih",
  marginBadge: "Margin {value}%",
  grossRevenue: "Pendapatan kotor",
  laborCost: "Biaya tenaga kerja (gaji)",
  overheadPortion: "Overhead (porsi)",
  cogsFreelance: "COGS (Freelance)",
  totalCost: "Total biaya",
  currentMargin: "Margin saat ini",
  pricingSuggestion: "Saran harga",
  breakEvenPrice: "Harga impas",
  suggestedPrice: "Harga saran (margin {value}%)",
  marginHealthy: "Margin memenuhi target. Harga terlihat sehat.",
  marginBelowTarget:
    "Margin di bawah target. Pertimbangkan menyesuaikan scope atau harga.",
}

const en: Record<keyof typeof id, string> = {
  pageTitle: "Calculator",

  calculationHeading: "Calculation",
  titleLabel: "Title",
  untitledCalculation: "Untitled calculation",
  projectLabel: "Project",
  selectProject: "Select project…",
  newCalculation: "New",
  newPhase: "New phase",

  savedCalculations: "Saved calculations",
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

  replaceCostsTitle: "Replace operational costs?",
  replaceCostsDescription:
    "Importing will replace all existing operational costs. This action cannot be undone. Continue?",
  importConfirm: "Import",
  deleteCalculationTitle: "Delete calculation?",
  deleteCalculationDescription:
    "This calculation will be permanently deleted. This action cannot be undone.",

  projectContext: "Project context",
  revenueUsd: "Revenue (USD)",
  exchangeRateIdr: "Exchange rate (IDR)",
  dailyWorkload: "Daily workload (hours)",
  targetMarginPercent: "Target margin (%)",
  examplePlaceholder: "e.g. {value}",

  timelineEngine: "Timeline engine",
  totalDays: "Total: {count} days",
  phaseName: "Phase name",
  days: "Days",
  buffer: "Buffer",
  addProjectPhase: "Add project phase",

  squadAllocation: "Squad allocation",
  selectTeamMember: "Select team member…",
  allocation: "Allocation",
  noTeamMembersAllocated: "No team members allocated yet.",

  freelanceHeading: "Freelance / COGS (optional)",
  addFreelance: "Add freelance",
  fullName: "Full name",
  role: "Role",
  totalFeeIdr: "Total fee (IDR)",
  notesOptional: "Notes (optional)",
  freelanceNotesPlaceholder: "e.g. scoped for illustration",
  noFreelanceCosts: "No freelance costs added.",

  operationalCosts: "Operational costs",
  operationalCostsDescription:
    "Monthly overhead allocation used for this project.",
  downloadCsvTemplate: "Download CSV template",
  downloadJsonTemplate: "Download JSON template",
  exportCsv: "Export CSV",
  exportJson: "Export JSON",
  importCosts: "Import costs",
  noOperationalCosts: "No operational costs loaded yet.",

  financialOverview: "Financial overview",
  netProfit: "Net profit",
  marginBadge: "{value}% Margin",
  grossRevenue: "Gross revenue",
  laborCost: "Labor cost (salary)",
  overheadPortion: "Overhead (Portion)",
  cogsFreelance: "COGS (Freelance)",
  totalCost: "Total cost",
  currentMargin: "Current margin",
  pricingSuggestion: "Pricing suggestion",
  breakEvenPrice: "Break-even price",
  suggestedPrice: "Suggested price ({value}% margin)",
  marginHealthy: "Margin meets target. Pricing looks healthy.",
  marginBelowTarget:
    "Margin is below target. Consider adjusting scope or price.",
}

export const calculator = { id, en }
