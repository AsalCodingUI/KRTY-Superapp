import { cx } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui"
import { RiArrowRightLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { siteConfig } from "./siteConfig"

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <p className="text-display-sm sm:text-display-lg mt-6 text-foreground-brand">
        404
      </p>
      <h1 className="text-display-xxs text-content dark:text-content mt-4">
        Page not found
      </h1>
      <p className="text-label-md text-content-subtle dark:text-content-placeholder mt-2">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <Link
        href={siteConfig.baseLinks.home}
        className={cx(buttonVariants({ variant: "secondary" }), "mt-8")}
      >
        Go to the home page
        <RiArrowRightLine className="ml-2 size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
