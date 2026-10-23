/**
 * "shell" strings: app chrome (top bar, sidebar, ⌘K search, notifications,
 * banners, error pages) and shared components. `id` is the source of truth;
 * `en` must have every key.
 */
const id = {
  // Sidebar
  sidebarTitle: "Sidebar",
  sidebarDescription: "Menampilkan sidebar versi mobile.",
  sidebarToggle: "Buka/tutup sidebar",
  sidebarResize: "Ubah lebar sidebar",
  sidebarResizeHint: "Geser untuk ubah lebar · klik dua kali untuk reset",
  navExpand: "Buka {name}",
  navCollapse: "Tutup {name}",

  // ⌘K search
  searchDescription: "Cari halaman, project, tugas, file, atau orang.",
  searchPlaceholder: "Cari halaman, project, tugas, file…",
  searchClear: "Hapus pencarian",
  searchScopeAll: "Semua",
  searchScopePages: "Halaman",
  searchScopeProjects: "Project",
  searchScopeTasks: "Tugas",
  searchScopeFiles: "File",
  searchScopePolicies: "Aturan",
  searchScopePeople: "Orang",
  searchGroupFiles: "File & dokumen",
  searchRecent: "Terakhir dibuka",
  searchOpenPage: "Buka halaman",
  searchMinChars: "Ketik minimal 2 huruf",
  searchNoResults: "Tidak ada hasil untuk “{query}”",
  searchTryOther: "Coba kata lain, atau cek ejaannya.",
  searchTryAll: "Coba kata lain, atau cari di Semua.",
  searchKeySelect: "Pilih",
  searchKeyOpen: "Buka",
  searchKeyFilter: "Filter",
  searchKeyClose: "Tutup",
  searchMetaDocument: "Dokumen",
  searchMetaLibrary: "Library",
  searchUnnamed: "Tanpa nama",
  commandTitle: "Palet perintah",
  commandDescription: "Cari perintah untuk dijalankan…",

  // Notifications
  notifications: "Notifikasi",
  notificationCenter: "Pusat notifikasi",
  notificationsReadAll: "Baca semua",
  notificationsMarkAllRead: "Tandai semua dibaca",
  notificationsUnread: "Belum dibaca",
  notificationsUnreadCount: "Belum dibaca ({count})",
  notificationsUnreadSr: "(belum dibaca)",
  notificationsAllRead: "Semua sudah dibaca",
  notificationsEmpty: "Belum ada notifikasi",
  notificationsNothingNew: "Belum ada yang baru di sini.",
  notificationsNothingNewTab: "Belum ada yang baru di tab ini.",
  notificationsDelete: "Hapus notifikasi",

  // Announcement banner (published rules)
  announcementRead: "Baca",

  // View as (impersonation)
  impersonationViewingAs: "Kamu melihat sebagai",
  impersonationMemberFallback: "anggota",
  impersonationRealAccount: "akun asli {name}",
  impersonationStopped: "Kembali ke akun kamu",
  impersonationStopFailed: "Gagal kembali ke akun kamu",

  // Error & 404 pages
  notFoundTitle: "Halaman tidak ditemukan",
  notFoundDescription:
    "Mungkin link-nya salah, halamannya sudah dipindah, atau kamu tidak punya akses ke sini.",
  errorTitle: "Ada yang tidak beres",
  errorDescription:
    "Halaman ini gagal dimuat. Coba lagi sebentar; kalau masih terjadi, kirim kode di bawah ke admin.",
  errorCode: "Kode: {code}",
  globalErrorTitle: "Aplikasi gagal dimuat",
  globalErrorDescription:
    "Coba muat ulang. Kalau masih terjadi, kirim kode di bawah ke admin.",
  goToDashboard: "Ke Dashboard",
  tryAgain: "Coba lagi",

  // Confirm dialog defaults
  confirmTitle: "Konfirmasi",
  confirmDescription: "Yakin ingin melanjutkan?",
  confirm: "Konfirmasi",

  // Pagers
  pagerPageOf: "Halaman {page} dari {count}",
  pagerFirst: "Halaman pertama",
  pagerPrevious: "Halaman sebelumnya",
  pagerNext: "Halaman berikutnya",
  pagerLast: "Halaman terakhir",

  // Views, filters, pickers
  viewLabel: "Tampilan",
  viewGrid: "Tampilan grid",
  viewList: "Tampilan list",
  viewKanban: "Tampilan kanban",
  viewTable: "Tampilan tabel",
  quarterFullYear: "Setahun",
  timeSelectPlaceholder: "Pilih jam",
  dateSelect: "Pilih tanggal",
  dateRangeSelect: "Pilih rentang tanggal",
  datePresetSelect: "Pilih {label}",
  dateTime: "Jam",
  dateStart: "Mulai",
  dateEnd: "Selesai",
  dateStartTime: "Jam mulai",
  dateEndTime: "Jam selesai",
  dateRange: "Rentang",
  dateApply: "Terapkan",

  // Data table
  noData: "Belum ada data",
  dataTableLabel: "Tabel data",
  dataTableEmptyDescription: "Data akan muncul di sini.",
  dataTableSearch: "Cari…",
  dataTableClearFilters: "Hapus filter",
  dataTableExport: "Ekspor",
  dataTableAddMember: "Tambah anggota",
  dataTableDisplayProperties: "Atur kolom",
  dataTableReorder: "Ubah urutan {label}",
  dataTableRowActions: "Aksi baris",
  dataTableSelected: "{count} dipilih",
  dataTableApprove: "Setujui",
  dataTableReject: "Tolak",
  dataTableClearSelection: "Batal pilih",
}

const en: Record<keyof typeof id, string> = {
  // Sidebar
  sidebarTitle: "Sidebar",
  sidebarDescription: "Displays the mobile sidebar.",
  sidebarToggle: "Toggle sidebar",
  sidebarResize: "Resize sidebar",
  sidebarResizeHint: "Drag to resize · double-click to reset",
  navExpand: "Expand {name}",
  navCollapse: "Collapse {name}",

  // ⌘K search
  searchDescription: "Search pages, projects, tasks, files, or people.",
  searchPlaceholder: "Search pages, projects, tasks, files…",
  searchClear: "Clear search",
  searchScopeAll: "All",
  searchScopePages: "Pages",
  searchScopeProjects: "Projects",
  searchScopeTasks: "Tasks",
  searchScopeFiles: "Files",
  searchScopePolicies: "Policies",
  searchScopePeople: "People",
  searchGroupFiles: "Files & documents",
  searchRecent: "Recently opened",
  searchOpenPage: "Go to page",
  searchMinChars: "Type at least 2 characters",
  searchNoResults: "No results for “{query}”",
  searchTryOther: "Try another word, or check the spelling.",
  searchTryAll: "Try another word, or search in All.",
  searchKeySelect: "Select",
  searchKeyOpen: "Open",
  searchKeyFilter: "Filter",
  searchKeyClose: "Close",
  searchMetaDocument: "Document",
  searchMetaLibrary: "Library",
  searchUnnamed: "Unnamed",
  commandTitle: "Command palette",
  commandDescription: "Search for a command to run…",

  // Notifications
  notifications: "Notifications",
  notificationCenter: "Notification center",
  notificationsReadAll: "Mark all read",
  notificationsMarkAllRead: "Mark all as read",
  notificationsUnread: "Unread",
  notificationsUnreadCount: "Unread ({count})",
  notificationsUnreadSr: "(unread)",
  notificationsAllRead: "You're all caught up",
  notificationsEmpty: "No notifications yet",
  notificationsNothingNew: "Nothing new here yet.",
  notificationsNothingNewTab: "Nothing new in this tab yet.",
  notificationsDelete: "Delete notification",

  // Announcement banner (published rules)
  announcementRead: "Read",

  // View as (impersonation)
  impersonationViewingAs: "You're viewing as",
  impersonationMemberFallback: "a member",
  impersonationRealAccount: "signed in as {name}",
  impersonationStopped: "Back to your account",
  impersonationStopFailed: "Couldn't return to your account",

  // Error & 404 pages
  notFoundTitle: "Page not found",
  notFoundDescription:
    "The link may be wrong, the page may have moved, or you don't have access to it.",
  errorTitle: "Something went wrong",
  errorDescription:
    "This page failed to load. Try again in a moment; if it keeps happening, send the code below to an admin.",
  errorCode: "Code: {code}",
  globalErrorTitle: "The app failed to load",
  globalErrorDescription:
    "Try reloading. If it keeps happening, send the code below to an admin.",
  goToDashboard: "Go to Dashboard",
  tryAgain: "Try again",

  // Confirm dialog defaults
  confirmTitle: "Confirm action",
  confirmDescription: "Are you sure you want to proceed?",
  confirm: "Confirm",

  // Pagers
  pagerPageOf: "Page {page} of {count}",
  pagerFirst: "First page",
  pagerPrevious: "Previous page",
  pagerNext: "Next page",
  pagerLast: "Last page",

  // Views, filters, pickers
  viewLabel: "View",
  viewGrid: "Grid view",
  viewList: "List view",
  viewKanban: "Kanban view",
  viewTable: "Table view",
  quarterFullYear: "Full year",
  timeSelectPlaceholder: "Select time",
  dateSelect: "Select date",
  dateRangeSelect: "Select date range",
  datePresetSelect: "Select {label}",
  dateTime: "Time",
  dateStart: "Start",
  dateEnd: "End",
  dateStartTime: "Start time",
  dateEndTime: "End time",
  dateRange: "Range",
  dateApply: "Apply",

  // Data table
  noData: "No data yet",
  dataTableLabel: "Data table",
  dataTableEmptyDescription: "Data will appear here.",
  dataTableSearch: "Search…",
  dataTableClearFilters: "Clear filters",
  dataTableExport: "Export",
  dataTableAddMember: "Add member",
  dataTableDisplayProperties: "Display properties",
  dataTableReorder: "Reorder {label}",
  dataTableRowActions: "Row actions",
  dataTableSelected: "{count} selected",
  dataTableApprove: "Approve",
  dataTableReject: "Reject",
  dataTableClearSelection: "Clear selection",
}

export const shell = { id, en }
