import { Button } from "@/components/ui/button"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@/shared/ui/lucide-icons"

/** Quiet prev/next pager under a grouped list; hidden for a single page. */
export function ListPager({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  /** Zero-based, like the data table's pager. */
  onPageChange: (pageIndex: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
      <span className="tabular-nums">
        Halaman {page} dari {pageCount}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Halaman sebelumnya"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 2)}
      >
        <RiArrowLeftSLine />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Halaman berikutnya"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page)}
      >
        <RiArrowRightSLine />
      </Button>
    </div>
  )
}
