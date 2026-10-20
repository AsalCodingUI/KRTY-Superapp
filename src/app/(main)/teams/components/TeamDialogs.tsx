"use client"

import { toast } from "sonner"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

// Tipe data form
interface TeamFormData {
  id?: string
  full_name: string
  email: string
  hourly_rate: number
}

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface TeamFormDialogProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Profile | null
}

export function TeamFormDialog({
  isOpen,
  onClose,
  initialData,
}: TeamFormDialogProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<TeamFormData>({
    full_name: "",
    email: "",
    hourly_rate: 0,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        hourly_rate: initialData.hourly_rate || 0,
      })
    } else {
      setFormData({ full_name: "", email: "", hourly_rate: 0 })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (initialData?.id) {
        // UPDATE
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            email: formData.email,
            hourly_rate: formData.hourly_rate,
          })
          .eq("id", initialData.id)

        if (error) throw error
      } else {
        // CREATE
        const fakeId = createId()
        const { error } = await supabase.from("profiles").insert({
          id: fakeId,
          full_name: formData.full_name,
          email: formData.email,
          hourly_rate: formData.hourly_rate,
          role: "employee",
          job_title: "Designer",
          krt_id: "KRT_" + Math.floor(Math.random() * 1000),
        })

        if (error) throw error
      }

      router.refresh()
      onClose()
    } catch (error) {
      toast.error("Gagal menyimpan data.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              {initialData ? "Edit member details" : "Add new member"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Emma Stone"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="emma@kretya.studio"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate" className="font-medium">
                Hourly Rate (IDR)
              </Label>
              <Input
                id="rate"
                type="number"
                placeholder="0"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourly_rate: Number(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            {/* FIX: Ganti DialogClose dengan Button biasa onClick={onClose} */}
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : initialData
                  ? "Update Member"
                  : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- DELETE DIALOG ---
interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  idsToDelete: string[]
  onSuccess: () => void
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  idsToDelete,
  onSuccess,
}: DeleteDialogProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .in("id", idsToDelete)

      if (error) throw error

      router.refresh()
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Gagal menghapus data.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-foreground dark:text-sm">
            Delete member?
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          {/* FIX: Ganti DialogClose dengan Button biasa */}
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Spinner data-icon="inline-start" />}
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
