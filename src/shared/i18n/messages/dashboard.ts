/** "dashboard" strings. `id` is the source of truth; `en` must have every key. */
const id = {
  // Page / errors
  profileNotFound: "Profil tidak ditemukan",
  loadFailed: "Gagal memuat data dashboard",
  errorUnauthorized: "Tidak punya akses. Silakan login lagi.",
  errorAccessDenied: "Akses ditolak",
  errorFetchFailed: "Gagal mengambil data dashboard",

  // Greeting & shared
  greeting: "Halo",
  greetingName: "Halo, {name}",
  greetingFallbackName: "User",
  footerView: "Lihat",
  unknownUser: "Tanpa nama",
  daysCount: "{n} hari",
  daysCountOne: "{n} hari",
  daysUnit: "hari",
  daysUnitOne: "hari",

  // Quick actions
  actionAttendance: "Kehadiran",
  actionReview360: "360 review",
  actionTeam: "Tim",
  actionCalendar: "Kalender",
  actionRequestLeave: "Ajukan cuti",
  actionMyKpi: "KPI saya",

  // Admin: attendance today
  adminAttendanceTitle: "Kehadiran hari ini",
  openAttendance: "Buka kehadiran",
  adminPresentUnit: "hadir",
  splitPresent: "Hadir",
  splitOnLeave: "Cuti",
  splitAbsent: "Tidak hadir",

  // Admin: pending reviews
  adminPendingReviewsTitle: "Review tertunda",
  openReview: "Buka review",
  adminReviewsAllDone: "Semua penilaian sudah lengkap.",
  adminReviewersPending: "{n} belum menilai",

  // Admin: leave
  leaveTitle: "Cuti",
  openLeave: "Buka cuti",
  adminLeavePending: "Menunggu",
  adminLeaveToday: "Cuti hari ini",
  adminLeaveAwaitingApproval: "Menunggu persetujuan",
  adminLeaveRequestsCount: "{n} pengajuan",
  adminLeaveRequestsCountOne: "{n} pengajuan",

  // Admin: team performance
  adminTeamPerformanceTitle: "Performa tim",
  openPerformance: "Buka performa",
  adminAvgScore: "Rata-rata skor",
  adminNeedsAttention: "Perlu perhatian",
  adminRated: "Sudah dinilai",
  adminRatedCount: "{n} orang",
  adminRatedCountOne: "{n} orang",
  adminNoData: "Belum ada data",
  adminAllOnTrack: "Semua di atas batas perhatian.",
  adminLeaveNonePending: "Tidak ada pengajuan cuti yang menunggu.",
  reasonFarBelowTarget: "Jauh di bawah target",
  reasonBelowExpectation: "Di bawah harapan",

  // Admin: recent activity
  adminRecentActivityTitle: "Aktivitas terbaru",
  adminRecentActivityEmpty: "Aktivitas tim akan muncul di sini.",
  activitySubmittedReview: "mengirim review 360",
  activityRequestedLeave: "mengajukan {type}",
  activityLeaveApproved: "cuti disetujui ({type})",
  activityLeaveRejected: "cuti ditolak ({type})",

  // Employee: today / attendance
  todayTitle: "Hari ini",
  statusWorking: "Sedang bekerja",
  statusSessionOpen: "Sesi belum ditutup",
  statusDone: "Selesai",
  statusNotClockedIn: "Belum clock in",

  // Employee: leave
  leaveBalanceHint: "Sisa cuti tahunan",
  leaveEmpty: "Belum ada pengajuan cuti.",
  leaveApproved: "Disetujui",
  leaveRejected: "Ditolak",
  leavePending: "Menunggu",
  leaveRequests: "Pengajuan",
  leaveRecordedCount: "{n} tercatat",

  // Employee: performance
  performanceTitle: "Performa",
  openKpi: "Buka KPI",

  // Employee: review & 1:1
  reviewOneOnOneTitle: "Review & 1:1",
  reviewOneOnOneEmpty: "Belum ada review atau sesi 1:1 terjadwal.",
  reviewDue: "Tenggat {date}",
  review360Label: "360 review · {period}",
  weekTitle: "Minggu ini",
  weekAhead: "belum lewat",
  weekNoClockIn: "tidak clock in",
  reviewSubmitted: "Terkirim",
  reviewNotFilled: "Belum diisi",
  oneOnOneWith: "Dengan {name}",
  oneOnOneSession: "Sesi 1:1",
  oneOnOneJoin: "Gabung",
  oneOnOneModeOnline: "online",
  oneOnOneModeOffline: "tatap muka",

  // Employee: projects
  projectsTitle: "Project aktif",
  openProjects: "Buka project",
  projectsEmpty: "Project muncul di sini setelah kamu ditugaskan.",
  projectOverdue: "Lewat tenggat",
  projectDueToday: "Hari ini",
  projectDaysLeft: "{n} hari lagi",
  projectDaysLeftOne: "{n} hari lagi",
  unknownProject: "Project tanpa nama",
}

const en: Record<keyof typeof id, string> = {
  // Page / errors
  profileNotFound: "Profile not found",
  loadFailed: "Failed to load dashboard data",
  errorUnauthorized: "Unauthorized. Please log in again.",
  errorAccessDenied: "Access denied",
  errorFetchFailed: "Failed to fetch dashboard data",

  // Greeting & shared
  greeting: "Hi",
  greetingName: "Hi, {name}",
  greetingFallbackName: "there",
  footerView: "View",
  unknownUser: "Unknown",
  daysCount: "{n} days",
  daysCountOne: "{n} day",
  daysUnit: "days",
  daysUnitOne: "day",

  // Quick actions
  actionAttendance: "Attendance",
  actionReview360: "360 review",
  actionTeam: "Team",
  actionCalendar: "Calendar",
  actionRequestLeave: "Request leave",
  actionMyKpi: "My KPI",

  // Admin: attendance today
  adminAttendanceTitle: "Attendance today",
  openAttendance: "Open attendance",
  adminPresentUnit: "present",
  splitPresent: "Present",
  splitOnLeave: "On leave",
  splitAbsent: "Absent",

  // Admin: pending reviews
  adminPendingReviewsTitle: "Pending reviews",
  openReview: "Open reviews",
  adminReviewsAllDone: "All reviews are complete.",
  adminReviewersPending: "{n} yet to review",

  // Admin: leave
  leaveTitle: "Leave",
  openLeave: "Open leave",
  adminLeavePending: "Pending",
  adminLeaveToday: "On leave today",
  adminLeaveAwaitingApproval: "Awaiting approval",
  adminLeaveRequestsCount: "{n} requests",
  adminLeaveRequestsCountOne: "{n} request",

  // Admin: team performance
  adminTeamPerformanceTitle: "Team performance",
  openPerformance: "Open performance",
  adminAvgScore: "Average score",
  adminNeedsAttention: "Needs attention",
  adminRated: "Rated",
  adminRatedCount: "{n} people",
  adminRatedCountOne: "{n} person",
  adminNoData: "No data yet",
  adminAllOnTrack: "Everyone is above the attention line.",
  adminLeaveNonePending: "No leave requests waiting.",
  reasonFarBelowTarget: "Well below target",
  reasonBelowExpectation: "Below expectations",

  // Admin: recent activity
  adminRecentActivityTitle: "Recent activity",
  adminRecentActivityEmpty: "Team activity will show up here.",
  activitySubmittedReview: "submitted a 360 review",
  activityRequestedLeave: "requested {type}",
  activityLeaveApproved: "leave approved ({type})",
  activityLeaveRejected: "leave rejected ({type})",

  // Employee: today / attendance
  todayTitle: "Today",
  statusWorking: "Working",
  statusSessionOpen: "Session not closed",
  statusDone: "Done",
  statusNotClockedIn: "Not clocked in",

  // Employee: leave
  leaveBalanceHint: "Annual leave remaining",
  leaveEmpty: "No leave requests yet.",
  leaveApproved: "Approved",
  leaveRejected: "Rejected",
  leavePending: "Pending",
  leaveRequests: "Requests",
  leaveRecordedCount: "{n} recorded",

  // Employee: performance
  performanceTitle: "Performance",
  openKpi: "Open KPI",

  // Employee: review & 1:1
  reviewOneOnOneTitle: "Reviews & 1:1",
  reviewOneOnOneEmpty: "No reviews or 1:1 sessions scheduled yet.",
  reviewDue: "Due {date}",
  review360Label: "360 review · {period}",
  weekTitle: "This week",
  weekAhead: "still ahead",
  weekNoClockIn: "no clock-in",
  reviewSubmitted: "Submitted",
  reviewNotFilled: "Not filled in",
  oneOnOneWith: "With {name}",
  oneOnOneSession: "1:1 session",
  oneOnOneJoin: "Join",
  oneOnOneModeOnline: "online",
  oneOnOneModeOffline: "in person",

  // Employee: projects
  projectsTitle: "Active projects",
  openProjects: "Open projects",
  projectsEmpty: "Projects show up here once you're assigned.",
  projectOverdue: "Overdue",
  projectDueToday: "Today",
  projectDaysLeft: "{n} days left",
  projectDaysLeftOne: "{n} day left",
  unknownProject: "Untitled project",
}

export const dashboard = { id, en }
