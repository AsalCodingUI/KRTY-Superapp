"use client"

import { Button } from "@/shared/ui"
import { Input } from "@/shared/ui"
import { Label } from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
import { RiMailSendLine } from "@remixicon/react"
import { useState } from "react"

export default function GeneralSettingsPage() {
  const { profile, loading } = useUserProfile()
  const [resetLoading, setResetLoading] = useState(false)
  const supabase = createClient()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.email) return

    setResetLoading(true)
    try {
      // Kirim email reset password ke email user
      const { error } = await supabase.auth.resetPasswordForEmail(
        profile.email,
        {
          redirectTo: `${window.location.origin}/auth/update-password`, // Pastikan route ini nanti di-handle
        },
      )

      if (error) throw error

      alert(`Password reset link has been sent to ${profile.email}`)
    } catch (error) {
      console.error(error)
      alert("Failed to send reset email. Please try again.")
    } finally {
      setResetLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-content-subtle text-body-sm p-4">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* SECTION 1: PERSONAL INFORMATION (READ ONLY) */}
      <section aria-labelledby="personal-information">
        <form onSubmit={handleChangePassword}>
          <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
            <div>
              <h2
                id="personal-information"
                className="text-content dark:text-content scroll-mt-10 font-semibold"
              >
                Personal information
              </h2>
              <p className="text-content-subtle text-body-sm mt-1">
                Information associated with your profile.
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                {/* My Name */}
                <div className="col-span-full">
                  <Label htmlFor="full-name" className="font-medium">
                    My Name
                  </Label>
                  <Input
                    id="full-name"
                    value={profile?.full_name || ""}
                    disabled // Disabled sesuai request
                    className="mt-2"
                  />
                </div>

                {/* Email */}
                <div className="col-span-full">
                  <Label htmlFor="email" className="font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled // Disabled sesuai request
                    className="mt-2"
                  />
                </div>

                {/* Job Title */}
                <div className="col-span-full">
                  <Label htmlFor="job-title" className="font-medium">
                    Job Title
                  </Label>
                  <Input
                    id="job-title"
                    value={profile?.job_title || ""}
                    disabled // Disabled sesuai request
                    className="mt-2"
                  />
                </div>

                {/* Change Password Button */}
                <div className="col-span-full mt-4 flex flex-col items-end gap-2">
                  <p className="text-content-subtle text-body-xs">
                    To change your password, click the button below to receive a
                    reset link via email.
                  </p>
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    isLoading={resetLoading}
                  >
                    <RiMailSendLine className="mr-2 size-4" />
                    Change password
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
