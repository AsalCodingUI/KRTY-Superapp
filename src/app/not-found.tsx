import { Button, Card } from "@/shared/ui"
import { RiArrowRightLine, RiErrorWarningLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="bg-surface min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <Card className="w-full p-8 text-center">
          <div className="space-y-5">
            <div className="bg-surface-danger-light mx-auto flex size-14 items-center justify-center rounded-full border border-border-danger-light">
              <RiErrorWarningLine className="size-6 text-foreground-danger" />
            </div>

            <div className="space-y-2">
              <p className="text-body-sm text-foreground-tertiary">Error 404</p>
              <h1 className="text-heading-lg text-foreground-primary">
                Page not found
              </h1>
              <p className="text-body-sm text-foreground-secondary">
                Sorry, we couldn&apos;t find the page you&apos;re looking for.
              </p>
            </div>

            <div className="pt-1">
              <Button asChild>
                <Link href="/dashboard">
                  Back to Dashboard
                  <RiArrowRightLine className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
