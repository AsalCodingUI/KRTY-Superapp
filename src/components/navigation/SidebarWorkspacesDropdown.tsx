"use client"
import { cx, focusInput } from "@/lib/utils"
// RiExpandUpDownLine dihapus karena dropdown hilang

export const WorkspacesDropdownDesktop = () => {
  return (
    // Dibuat sebagai div statis, bukan DropdownTrigger
    <div
      className={cx(
        "flex w-full items-center gap-x-2.5 px-2",
        // Focus ring dihapus karena tidak bisa diklik
        focusInput, // tetep pake styling focusInput buat border styling dasar
      )}
    >
      <span
        className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary p-2 text-xs font-medium text-white dark:bg-primary"
        aria-hidden="true"
      >
        KS
      </span>
      <div className="flex w-full items-center justify-between gap-x-4 truncate">
        <div className="truncate">
          <p className="truncate whitespace-nowrap text-sm font-medium text-content dark:text-content">
            Kretya Studio {/* Diubah dari Retail analytics */}
          </p>
          <p className="whitespace-nowrap text-left text-xs text-content-subtle dark:text-content-subtle">
            Team Space {/* Diubah dari Member */}
          </p>
        </div>
        {/* RiExpandUpDownLine dihapus */}
      </div>
    </div>
  )
}

// Komponen mobile tidak perlu diubah karena tidak dipanggil di Sidebar.tsx
export const WorkspacesDropdownMobile = () => null