import { ArrowAnimated, Button } from "@/shared/ui"
import Link from "next/link"
import { DatabaseLogo } from "../../public/DatabaseLogo"
import { siteConfig } from "./siteConfig"

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Link href={siteConfig.baseLinks.home}>
        <DatabaseLogo className="mt-6 h-10" />
      </Link>
      <p className="text-display-sm sm:text-display-lg mt-6 text-blue-600 dark:text-blue-500">
        404
      </p>
      <h1 className="text-display-xxs text-content dark:text-content mt-4">
        Page not found
      </h1>
      <p className="text-label-md text-content-subtle dark:text-content-placeholder mt-2">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <Button asChild className="group mt-8" variant="secondary">
        <Link href={siteConfig.baseLinks.home}>
          Go to the home page
          <ArrowAnimated
            className="stroke-content dark:stroke-content"
            aria-hidden="true"
          />
        </Link>
      </Button>
    </div>
  )
}
