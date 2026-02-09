"use client"

import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import {
  Button, Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle, Label, TextInput
} from "@/shared/ui"
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
      alert("Gagal menyimpan data. Cek console untuk detail.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-semibold">
              {initialData ? "Edit member details" : "Add new member"}
            </DialogTitle>
            <DialogCloseButton />
          </DialogHeader>

          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-medium">
                Full Name
              </Label>
              <TextInput
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
              <TextInput
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
              <TextInput
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
          </DialogBody>

          <DialogFooter>
            {/* FIX: Ganti DialogClose dengan Button biasa onClick={onClose} */}
            <Button
              variant="secondary"
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
      alert("Gagal menghapus data.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-content dark:text-content font-semibold">
            Delete member?
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogFooter>
          {/* FIX: Ganti DialogClose dengan Button biasa */}
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            isLoading={loading}
          >
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
