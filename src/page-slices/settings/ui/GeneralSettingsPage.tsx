"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Label, TextInput } from "@/shared/ui"

export default function GeneralSettingsPage() {
  const { profile, loading } = useUserProfile()

  if (loading) {
    return (
      <div className="text-foreground-secondary text-body-sm p-4">
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
              className="text-foreground-primary scroll-mt-10 font-semibold"
            >
              Personal information
            </h2>
            <p className="text-foreground-secondary text-body-sm mt-1">
              Information associated with your profile.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="col-span-full">
                <Label htmlFor="full-name" className="font-medium">
                  My Name
                </Label>
                <TextInput
                  id="full-name"
                  value={profile?.full_name || ""}
                  disabled
                  className="mt-2"
                />
              </div>

              <div className="col-span-full">
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
                <TextInput
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="mt-2"
                />
              </div>

              <div className="col-span-full">
                <Label htmlFor="job-title" className="font-medium">
                  Job Title
                </Label>
                <TextInput
                  id="job-title"
                  value={profile?.job_title || ""}
                  disabled
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
