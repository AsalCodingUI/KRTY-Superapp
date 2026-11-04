export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No sidebar or top bar: each fullscreen route brings its own frame.
  return <>{children}</>
}
