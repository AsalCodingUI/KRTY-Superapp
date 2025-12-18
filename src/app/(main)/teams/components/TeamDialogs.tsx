"use client"

import { Button } from "@/components/Button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Dialog"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { v4 as uuidv4 } from 'uuid'

// Tipe data form
interface TeamFormData {
    id?: string
    full_name: string
    email: string
    hourly_rate: number
}

type Profile = Database['public']['Tables']['profiles']['Row']

interface TeamFormDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Profile | null
}

export function TeamFormDialog({ isOpen, onClose, initialData }: TeamFormDialogProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState<TeamFormData>({
        full_name: "",
        email: "",
        hourly_rate: 0
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                full_name: initialData.full_name || "",
                email: initialData.email || "",
                hourly_rate: initialData.hourly_rate || 0
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
                const fakeId = uuidv4()
                const { error } = await supabase
                    .from("profiles")
                    .insert({
                        id: fakeId,
                        full_name: formData.full_name,
                        email: formData.email,
                        hourly_rate: formData.hourly_rate,
                        role: "employee",
                        job_title: "Designer",
                        krt_id: "KRT_" + Math.floor(Math.random() * 1000)
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
                        <DialogTitle className="font-semibold">{initialData ? "Edit member details" : "Add new member"}</DialogTitle>
                        <DialogDescription className="mt-1 text-sm leading-6">
                            {initialData
                                ? "Update the personal information and hourly rate for this team member."
                                : "Fill in the details to add a new member to your team."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="font-medium">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Emma Stone"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="font-medium">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="emma@kretya.studio"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="rate" className="font-medium">Hourly Rate (IDR)</Label>
                            <Input
                                id="rate"
                                type="number"
                                placeholder="0"
                                value={formData.hourly_rate}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        {/* FIX: Ganti DialogClose dengan Button biasa onClick={onClose} */}
                        <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (initialData ? "Update Member" : "Add Member")}
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

export function DeleteConfirmDialog({ isOpen, onClose, idsToDelete, onSuccess }: DeleteDialogProps) {
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
                    <DialogTitle className="text-content dark:text-content font-semibold">Delete member?</DialogTitle>
                    <DialogDescription className="mt-1 text-sm leading-6">
                        This action cannot be undone. This will permanently delete <b>{idsToDelete.length}</b> member(s).
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6">
                    {/* FIX: Ganti DialogClose dengan Button biasa */}
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading} isLoading={loading}>
                        Yes, delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}