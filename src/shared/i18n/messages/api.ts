/** "api" strings: errors and messages returned by route handlers. */
const id = {
  // Shared
  unauthorized: "Silakan masuk terlebih dahulu",
  forbidden: "Anda tidak punya akses",
  adminOnly: "Akses ditolak: khusus admin",
  profileNotFound: "Profil tidak ditemukan",
  invalidRequest: "Permintaan tidak valid",
  invalidPayload: "Data yang dikirim tidak valid",
  serverError: "Terjadi kesalahan pada server",
  missingIdOrPayload: "ID atau data belum diisi",

  // Notifications
  notificationIdRequired: "ID notifikasi wajib diisi",
  notificationsFetchFailed: "Gagal memuat notifikasi",
  notificationsUpdateFailed: "Gagal memperbarui notifikasi",
  notificationDeleteFailed: "Gagal menghapus notifikasi",

  // Attendance
  attendanceLogNotFound: "Data absensi tidak ditemukan",
  attendanceSaveFailed: "Gagal menyimpan absensi",
  attendanceUpdateFailed: "Gagal memperbarui absensi",

  // Calendar
  rsvpFieldsRequired: "ID acara dan status wajib diisi",
  rsvpInvalidStatus: "Status RSVP tidak valid",
  rsvpUpdateFailed: "Gagal memperbarui status RSVP",
  calendarCheckFailed: "Gagal memeriksa koneksi kalender",

  // Calculator
  missingProjectId: "ID proyek belum diisi",
  missingCalculationId: "ID kalkulasi belum diisi",

  // Finance
  missingInvoiceId: "ID invoice belum diisi",
  missingPaymentMethodName: "Nama metode pembayaran belum diisi",
  missingIdOrName: "ID atau nama belum diisi",
  missingPaymentMethodId: "ID metode pembayaran belum diisi",

  // n8n / migrate
  webhookMissing: "Konfigurasi belum lengkap: URL webhook tidak ada",
  noReviewsForCycle: "Belum ada review untuk siklus {cycle}",
  noReviewsForUser: "Belum ada review untuk pengguna ini",
  workflowTriggerFailed: "Gagal menjalankan workflow",
  aiResultInvalid:
    "AI belum mengembalikan rangkuman yang lengkap. Coba proses lagi.",
  aiTimeout: "AI terlalu lama menjawab. Coba proses lagi.",
  migrateRunSql: "Jalankan SQL berikut di Supabase SQL Editor",
  migrateFailed: "Migrasi gagal",

  // Leave
  leaveEndBeforeStart: "Tanggal selesai harus setelah tanggal mulai",
  leaveNoBusinessDays: "Rentang tanggal tidak berisi hari kerja",
  leaveMinNotice: "Cuti tahunan diajukan paling lambat H-{days}",
  leaveMaxDays: "Maksimal {days} hari kerja per pengajuan",
  leaveNotEligible: "Belum berhak cuti tahunan",
  leaveQuotaExceeded: "Sisa cuti tahunan tinggal {remaining} dari {quota} hari",
  leaveRequestNotFound: "Pengajuan cuti tidak ditemukan",
  leaveApprovedLocked: "Pengajuan yang sudah disetujui tidak bisa diubah",
  leaveOnlyPendingCancel:
    "Hanya pengajuan yang masih menunggu yang bisa dibatalkan",
  leaveSubmitFailed: "Gagal mengirim pengajuan cuti",
  leaveUpdateFailed: "Gagal memperbarui pengajuan cuti",
  leaveCancelFailed: "Gagal membatalkan pengajuan",
}

const en: Record<keyof typeof id, string> = {
  // Shared
  unauthorized: "Please sign in first",
  forbidden: "You don't have access",
  adminOnly: "Forbidden: admins only",
  profileNotFound: "Profile not found",
  invalidRequest: "Invalid request",
  invalidPayload: "Invalid payload",
  serverError: "Internal server error",
  missingIdOrPayload: "Missing id or payload",

  // Notifications
  notificationIdRequired: "Notification id required",
  notificationsFetchFailed: "Failed to fetch notifications",
  notificationsUpdateFailed: "Failed to update notifications",
  notificationDeleteFailed: "Failed to delete notification",

  // Attendance
  attendanceLogNotFound: "Attendance log not found",
  attendanceSaveFailed: "Failed to save attendance log",
  attendanceUpdateFailed: "Failed to update attendance log",

  // Calendar
  rsvpFieldsRequired: "Event ID and status required",
  rsvpInvalidStatus: "Invalid RSVP status",
  rsvpUpdateFailed: "Failed to update RSVP status",
  calendarCheckFailed: "Failed to check calendar connection",

  // Calculator
  missingProjectId: "Missing project id",
  missingCalculationId: "Missing calculation id",

  // Finance
  missingInvoiceId: "Missing invoice id",
  missingPaymentMethodName: "Missing payment method name",
  missingIdOrName: "Missing id or name",
  missingPaymentMethodId: "Missing payment method id",

  // n8n / migrate
  webhookMissing: "Configuration error: missing webhook URL",
  noReviewsForCycle: "No reviews found for cycle {cycle}",
  noReviewsForUser: "No reviews found for this user",
  workflowTriggerFailed: "Failed to trigger workflow",
  aiResultInvalid:
    "The AI didn't return a complete summary. Try processing again.",
  aiTimeout: "The AI took too long to answer. Try processing again.",
  migrateRunSql: "Please run the following SQL in Supabase SQL Editor",
  migrateFailed: "Migration failed",

  // Leave
  leaveEndBeforeStart: "End date must be after the start date",
  leaveNoBusinessDays: "The date range has no working days",
  leaveMinNotice:
    "Annual leave must be requested at least {days} days in advance",
  leaveMaxDays: "At most {days} working days per request",
  leaveNotEligible: "Not yet eligible for annual leave",
  leaveQuotaExceeded: "Only {remaining} of {quota} annual leave days remaining",
  leaveRequestNotFound: "Leave request not found",
  leaveApprovedLocked: "Approved requests can't be changed",
  leaveOnlyPendingCancel: "Only pending requests can be cancelled",
  leaveSubmitFailed: "Failed to submit leave request",
  leaveUpdateFailed: "Failed to update leave request",
  leaveCancelFailed: "Failed to cancel request",
}

export const api = { id, en }
