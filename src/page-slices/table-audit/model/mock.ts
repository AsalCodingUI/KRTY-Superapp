import type { ProjectListRow } from "@/page-slices/projects/ui/ProjectList"
import type { Database } from "@/shared/types/database.types"

/** Mock rows for /table (never saved; no real people). */

type Tables = Database["public"]["Tables"]
const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const at = (offset: number, hour: number, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const people = [
  ["Ayu Lestari", "Product Designer", "employee"],
  ["Bima Pratama", "Project Manager", "employee"],
  ["Citra Wulandari", "Frontend Engineer", "employee"],
  ["Dimas Saputra", "Backend Engineer", "employee"],
  ["Eka Putri", "Finance", "stakeholder"],
] as const

export const teamMembers = people.map(
  ([full_name, job_title, role], i) =>
    ({
      id: `mock-person-${i}`,
      full_name,
      job_title,
      role,
      email: `${full_name.split(" ")[0].toLowerCase()}@example.com`,
      avatar_url: null,
      employment_status: "Active",
      created_at: at(-200 + i * 20, 9),
    }) as unknown as Tables["profiles"]["Row"],
)

export const leaveApprovals = [
  ["Annual Leave", "pending", 3, 4, "Liburan keluarga"],
  ["Sick Leave", "pending", 0, 0, "Demam"],
  ["WFH", "approved", 5, 5, "Nunggu tukang"],
  ["Annual Leave", "rejected", 10, 12, "Mudik"],
].map(
  ([leave_type, status, from, to, reason], i) =>
    ({
      id: 9000 + i,
      user_id: `mock-person-${i}`,
      leave_type,
      status,
      start_date: day(from as number),
      end_date: day(to as number),
      reason,
      review_note: null,
      proof_url: null,
      created_at: at(-2 - i, 10),
      updated_at: null,
      profiles: { full_name: people[i][0], avatar_url: null },
    }) as Tables["leave_requests"]["Row"] & {
      profiles: { full_name: string; avatar_url: string | null }
    },
)

export const myLeave: Tables["leave_requests"]["Row"][] = leaveApprovals.map(
  ({ profiles: _p, ...row }) => row,
)

export const leaveBalances = people.map(([full_name, job_title], i) => ({
  id: `mock-person-${i}`,
  full_name,
  avatar_url: null,
  job_title,
  leave_used: [2, 5, 0, 8, 12][i],
  leave_balance: [10, 7, 12, 4, 0][i],
  leave_quota: 12,
  leave_note: i === 4 ? "Habis" : null,
}))

const assignees = (...idx: number[]) =>
  idx.map((i) => ({
    id: `mock-assign-${i}`,
    user_id: `mock-person-${i}`,
    profiles: { full_name: people[i][0], avatar_url: null },
  }))

export const projects: ProjectListRow[] = [
  ["Website Kopi Senja", "Active", "Oakland", -30, 20, [0, 2]],
  ["App Kasir Toko Bunga", "Active", "Flora & Co", -10, 45, [1, 3, 2]],
  ["Rebrand Klinik Sehat", "Review", "Klinik Sehat", -60, -2, [0]],
  ["Dashboard Logistik", "Planned", "Antar Cepat", 14, 90, [3]],
  ["Landing Page Event", "Completed", "Nusa Fest", -90, -40, [0, 1]],
].map(([name, status, client_name, from, to, team], i) => ({
  id: `mock-project-${i}`,
  name: name as string,
  status: status as ProjectListRow["status"],
  client_name: client_name as string,
  start_date: day(from as number),
  end_date: day(to as number),
  quarter_id: null,
  category: { id: "mock-cat", name: i % 2 ? "Aplikasi" : "Website" },
  project_assignments: assignees(...(team as number[])),
}))

export const subscriptions = [
  { name: "Figma", cycle: "Bulanan · 12 Nov", amount: "Rp 720.000" },
  { name: "Vercel", cycle: "Bulanan · 20 Nov", amount: "$20" },
  {
    name: "Google Workspace",
    cycle: "Tahunan · 3 Feb",
    amount: "Rp 4.200.000",
  },
]

export const markdownTable = `| Fitur | Status | PIC |
| --- | --- | --- |
| Login Google | Selesai | Citra |
| Notifikasi | Jalan | Dimas |
| Export PDF | Belum | Ayu |`

export const sheet: string[][] = [
  ["Bulan", "Pemasukan", "Pengeluaran", "Saldo"],
  ["Agustus", "120.000.000", "84.000.000", "36.000.000"],
  ["September", "98.000.000", "77.500.000", "20.500.000"],
  ["Oktober", "143.000.000", "90.200.000", "52.800.000"],
]
