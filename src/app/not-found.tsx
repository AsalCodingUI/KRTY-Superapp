import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RiArrowRightLine, RiErrorWarningLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full gap-0 p-8 text-center">
          <div className="space-y-5">
            <div className="bg-destructive/10 border-destructive/30 mx-auto flex size-14 items-center justify-center rounded-full border">
              <RiErrorWarningLine className="text-destructive size-6" />
            </div>

            <div className="space-y-2">
              <p className="text-body-sm text-muted-foreground/70">Error 404</p>
              <h1 className="text-heading-lg text-foreground">
                Page not found
              </h1>
              <p className="text-body-sm text-muted-foreground">
                Sorry, we couldn&apos;t find the page you&apos;re looking for.
              </p>
            </div>

            <div className="pt-1">
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                Back to Dashboard
                <RiArrowRightLine className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
