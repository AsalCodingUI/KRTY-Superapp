type ProfileLike = {
  id: string
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  role?: string | null
  job_title?: string | null
  krt_id?: string | null
  hourly_rate?: number | null
  team_id?: string | null
  manager_id?: string | null
  is_super_admin?: boolean | null
  monthly_salary?: number | null
  leave_balance?: number | null
  leave_used?: number | null
  created_at?: string | null
}

function sortByCreatedAtAscending<T extends ProfileLike>(profiles: T[]) {
  return [...profiles].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0
    const bTime = b.created_at ? Date.parse(b.created_at) : 0
    return aTime - bTime
  })
}

export function mergeDuplicateProfiles<T extends ProfileLike>(
  profiles: T[],
): T {
  const sorted = sortByCreatedAtAscending(profiles)
  const oldest = sorted[0]
  const newest = sorted[sorted.length - 1]

  return {
    ...oldest,
    ...newest,
    id: newest.id,
    email: newest.email || oldest.email || null,
    full_name: oldest.full_name || newest.full_name || null,
    avatar_url: newest.avatar_url || oldest.avatar_url || null,
    role: oldest.role || newest.role || null,
    job_title: oldest.job_title || newest.job_title || null,
    krt_id: oldest.krt_id || newest.krt_id || null,
    hourly_rate: oldest.hourly_rate ?? newest.hourly_rate ?? null,
    team_id: oldest.team_id || newest.team_id || null,
    manager_id: oldest.manager_id || newest.manager_id || null,
    is_super_admin: newest.is_super_admin ?? oldest.is_super_admin ?? null,
    monthly_salary: oldest.monthly_salary ?? newest.monthly_salary ?? null,
    leave_balance: oldest.leave_balance ?? newest.leave_balance ?? null,
    leave_used: oldest.leave_used ?? newest.leave_used ?? null,
    created_at: oldest.created_at || newest.created_at || null,
  } as T
}

export function dedupeProfilesByEmail<T extends ProfileLike>(
  profiles: T[],
): T[] {
  const groups = new Map<string, T[]>()
  const noEmail: T[] = []

  for (const profile of profiles) {
    const email = profile.email?.trim().toLowerCase()
    if (!email) {
      noEmail.push(profile)
      continue
    }

    const group = groups.get(email) || []
    group.push(profile)
    groups.set(email, group)
  }

  const deduped = Array.from(groups.values()).map((group) =>
    group.length === 1 ? group[0] : mergeDuplicateProfiles(group),
  )

  return [...deduped, ...noEmail]
}
