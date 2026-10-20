"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function GeneralSettingsPage() {
  const { profile, loading } = useUserProfile()

  if (loading) {
    return (
      <div className="text-muted-foreground text-body-sm p-4">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="personal-information">
        <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
          <div>
            <h2
              id="personal-information"
              className="text-foreground scroll-mt-10 font-semibold"
            >
              Personal information
            </h2>
            <p className="text-muted-foreground text-body-sm mt-1">
              Information associated with your profile.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="col-span-full">
                <Label htmlFor="full-name" className="font-medium">
                  My Name
                </Label>
                <Input
                  id="full-name"
                  value={profile?.full_name || ""}
                  disabled
                  className="mt-2 h-7"
                />
              </div>

              <div className="col-span-full">
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="mt-2 h-7"
                />
              </div>

              <div className="col-span-full">
                <Label htmlFor="job-title" className="font-medium">
                  Job Title
                </Label>
                <Input
                  id="job-title"
                  value={profile?.job_title || ""}
                  disabled
                  className="mt-2 h-7"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
