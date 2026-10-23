/** "teams" strings. `id` is the source of truth; `en` must have every key. */
const id = {
  title: "Tim",
  membersAccess: "Anggota & Akses",
  loadError: "Gagal memuat anggota tim",
  statsLoadError: "Gagal memuat statistik tim",

  statTotal: "Total anggota",
  statDesigner: "Designer",
  statDeveloper: "Developer",
  statProjectManager: "Project Manager",
  statAdmin: "Admin/Stakeholder",

  searchPlaceholder: "Cari anggota...",

  colName: "Nama",
  colJobTitle: "Jabatan",
  colAccess: "Akses",
  colEmail: "Email",
  selectAll: "Pilih semua",
  selectRow: "Pilih baris",
  unknownName: "Tanpa nama",
  noJobTitle: "Tanpa jabatan",
  accessStakeholder: "Stakeholder",
  accessEmployee: "Karyawan",

  noAccessTitle: "Tidak punya akses",
  noAccessDesc: "Halaman ini hanya untuk super admin.",

  userSettings: "Pengaturan pengguna",
  guest: "Tamu",
  unknownUser: "Pengguna tanpa nama",
  userAlt: "Pengguna",
}

const en: Record<keyof typeof id, string> = {
  title: "Team",
  membersAccess: "Members & access",
  loadError: "Couldn't load team members",
  statsLoadError: "Couldn't load team stats",

  statTotal: "Total members",
  statDesigner: "Designers",
  statDeveloper: "Developers",
  statProjectManager: "Project managers",
  statAdmin: "Admins/Stakeholders",

  searchPlaceholder: "Search members...",

  colName: "Name",
  colJobTitle: "Job title",
  colAccess: "Access",
  colEmail: "Email",
  selectAll: "Select all",
  selectRow: "Select row",
  unknownName: "Unknown",
  noJobTitle: "No job title",
  accessStakeholder: "Stakeholder",
  accessEmployee: "Employee",

  noAccessTitle: "No access",
  noAccessDesc: "This page is for super admins only.",

  userSettings: "User settings",
  guest: "Guest",
  unknownUser: "Unknown user",
  userAlt: "User",
}

export const teams = { id, en }
