
import { Badge, Button } from "@/components/ui";
import { RiArchiveLine, RiDeleteBinLine, RiEditLine, RiEyeLine, RiRefreshLine } from "@remixicon/react";
import { ColumnDef } from "@tanstack/react-table";

// Define the shape of our data (must match SLADashboard definition)
export interface SLA {
    id: string;
    client_name: string;
    title: string;
    status: string;
    created_at: string | null;
    archived_at: string | null;
}

export const activeSLAColumns = (
    onEdit: (id: string) => void,
    onArchive: (id: string) => void,
    onView: (id: string) => void
): ColumnDef<SLA>[] => [
        {
            accessorKey: "client_name",
            header: "Client Name",
        },
        {
            accessorKey: "title",
            header: "Project/Title",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => <Badge variant="zinc">{getValue() as string}</Badge>,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onView(row.original.id)}>
                        <RiEyeLine className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(row.original.id)}>
                        <RiEditLine className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onArchive(row.original.id)}>
                        <RiArchiveLine className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

export const archivedSLAColumns = (
    onRestore: (id: string) => void,
    onDelete: (id: string) => void
): ColumnDef<SLA>[] => [
        {
            accessorKey: "client_name",
            header: "Client Name",
        },
        {
            accessorKey: "title",
            header: "Project/Title",
        },
        {
            accessorKey: "archived_at",
            header: "Archived At",
            cell: ({ getValue }) => {
                const val = getValue() as string | null;
                return val ? new Date(val).toLocaleDateString() : "-";
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onRestore(row.original.id)}>
                        <RiRefreshLine className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(row.original.id)}>
                        <RiDeleteBinLine className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];
