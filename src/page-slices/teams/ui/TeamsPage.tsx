"use client"

import { columns } from "@/app/(main)/teams/Columns"
import { TeamFormDialog } from "@/app/(main)/teams/components/TeamDialogs"
import { TeamStats } from "@/app/(main)/teams/components/TeamStats"
import { createClient } from '@/shared/api/supabase/client'
import { Database } from '@/shared/types/database.types'
import { DataTable } from '@/shared/ui/data/DataTable'
import { useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Profile = Database['public']['Tables']['profiles']['Row']

interface TeamsPageProps {
    initialData: Profile[]
    page: number
    pageSize: number
    totalCount: number
}

export function TeamsPage({
    initialData,
    page,
    pageSize,
    totalCount
}: TeamsPageProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Profile | null>(null)

    // Handle page change
    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", (newPage + 1).toString()) // Convert 0-index to 1-index
        router.push(`${pathname}?${params.toString()}`)
    }

    const pageCount = Math.ceil(totalCount / pageSize)

    return (
        <>
            <div className="sm:flex sm:items-center sm:justify-between">
                <h1 className="text-lg font-semibold text-content sm:text-xl dark:text-content">
                    Team Members
                </h1>
            </div>

            {/* POSISI BARU: DI BAWAH JUDUL */}
            <section className="mt-6">
                <TeamStats data={initialData} />
            </section>

            <div className="mt-4 sm:mt-6 lg:mt-6">
                <DataTable
                    data={initialData}
                    columns={columns}
                    manualPagination={true}
                    pageCount={pageCount}
                    pageIndex={page - 1} // Convert 1-index to 0-index
                    onPageChange={handlePageChange}
                    onCreate={() => {
                        setEditingItem(null)
                        setIsAddOpen(true)
                    }}
                    onEdit={(item) => {
                        setEditingItem(item)
                        setIsAddOpen(true)
                    }}
                    onDelete={async (ids) => {
                        if (!confirm(`Delete ${ids.length} team member(s)?`)) return
                        const supabase = createClient()
                        const { error } = await supabase
                            .from('profiles')
                            .delete()
                            .in('id', ids as string[])
                        if (error) {
                            alert('Error deleting: ' + error.message)
                        } else {
                            router.refresh()
                        }
                    }}
                    showTableWrapper={true}
                    tableTitle="Team Members"
                    tableDescription="Manage your team members and their roles"
                />
            </div>

            <TeamFormDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                initialData={editingItem}
            />
        </>
    )
}
