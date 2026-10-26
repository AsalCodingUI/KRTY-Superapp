/** "settings" strings. `id` is the source of truth; `en` must have every key. */
const id = {
  // Auto clock-out (attendance)
  autoClockOut: "Clock out otomatis",
  notSignedIn: "Belum masuk",
  saveSettingsFailed: "Gagal menyimpan pengaturan.",
  autoClockOutOn: "Clock out otomatis pukul {time}.",
  autoClockOutOff: "Clock out otomatis dimatikan.",

  // Members & access: labels
  roleEmployee: "Karyawan",
  roleStakeholder: "Stakeholder",
  employmentKaryawan: "Karyawan",
  employmentMagang: "Magang",

  // Members & access: toasts
  saveChangesFailed: "Gagal menyimpan perubahan.",
  saved: "Tersimpan.",
  switchAccountFailed: "Gagal berpindah akun",
  switchAccountFailedStatus: "Gagal berpindah akun ({status})",
  nowViewingAs: "Sekarang melihat sebagai anggota ini",
  deleteMemberFailed: "Gagal menghapus anggota",
  memberDeleted: "Anggota dihapus.",
  loadMembersFailed: "Gagal memuat data anggota.",

  // Members list
  searchMembers: "Cari anggota…",
  addMember: "Tambah anggota",
  colName: "Nama",
  colRole: "Role",
  colJobTitle: "Jabatan",
  colTeam: "Tim",
  colAccess: "Akses",
  superAdmin: "Super admin",
  noMembers: "Tidak ada anggota.",

  // Member sheet
  memberDetail: "Detail anggota",
  noName: "Tanpa nama",
  you: "Kamu",
  viewAs: "Lihat sebagai",
  roleHint: "Stakeholder bisa mengelola tim & project.",
  levelEmployee: "Karyawan",
  levelPm: "PM",
  levelStakeholder: "Stakeholder",
  selectJobTitle: "Pilih jabatan",
  noTeam: "Tanpa tim",
  status: "Status",
  joinDate: "Mulai kerja",
  joinDateHint: "Dipakai untuk menghitung jatah cuti.",
  superAdminSelfHint: "Tidak bisa mengubah status kamu sendiri.",
  superAdminHint: "Bisa membuka pengaturan anggota & akses.",
  deleteMember: "Hapus anggota",
  deleteMemberHint: "Semua datanya ikut terhapus. Tidak bisa dibatalkan.",
  deleteMemberTitle: "Hapus anggota?",
  deleteMemberDescription:
    "Kehadiran, cuti, review, dan kontrak {name} ikut terhapus permanen.",

  // Add member dialog
  emailAlreadyRegistered: "Email ini sudah terdaftar.",
  addMemberFailed: "Gagal menambah anggota",
  memberAdded: "Anggota ditambahkan.",
  fullName: "Nama lengkap",
  email: "Email",
}

const en: Record<keyof typeof id, string> = {
  autoClockOut: "Auto clock out",
  notSignedIn: "Not signed in",
  saveSettingsFailed: "Failed to save settings.",
  autoClockOutOn: "Auto clock out at {time}.",
  autoClockOutOff: "Auto clock out turned off.",

  roleEmployee: "Employee",
  roleStakeholder: "Stakeholder",
  employmentKaryawan: "Employee",
  employmentMagang: "Intern",

  saveChangesFailed: "Failed to save changes.",
  saved: "Saved.",
  switchAccountFailed: "Failed to switch account",
  switchAccountFailedStatus: "Failed to switch account ({status})",
  nowViewingAs: "Now viewing as this member",
  deleteMemberFailed: "Failed to delete member",
  memberDeleted: "Member deleted.",
  loadMembersFailed: "Failed to load member data.",

  searchMembers: "Search members…",
  addMember: "Add member",
  colName: "Name",
  colRole: "Role",
  colJobTitle: "Job title",
  colTeam: "Team",
  colAccess: "Access",
  superAdmin: "Super admin",
  noMembers: "No members.",

  memberDetail: "Member details",
  noName: "No name",
  you: "You",
  viewAs: "View as",
  roleHint: "Stakeholders can manage teams & projects.",
  levelEmployee: "Employee",
  levelPm: "PM",
  levelStakeholder: "Stakeholder",
  selectJobTitle: "Select job title",
  noTeam: "No team",
  status: "Status",
  joinDate: "Start date",
  joinDateHint: "Used to work out leave allowance.",
  superAdminSelfHint: "You can't change your own status.",
  superAdminHint: "Can open member & access settings.",
  deleteMember: "Delete member",
  deleteMemberHint: "All their data goes too. This can't be undone.",
  deleteMemberTitle: "Delete member?",
  deleteMemberDescription:
    "{name}'s attendance, leave, reviews and contracts are deleted for good.",

  emailAlreadyRegistered: "This email is already registered.",
  addMemberFailed: "Failed to add member",
  memberAdded: "Member added.",
  fullName: "Full name",
  email: "Email",
}

export const settings = { id, en }
