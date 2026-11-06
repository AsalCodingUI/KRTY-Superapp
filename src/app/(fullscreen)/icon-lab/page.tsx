import { IconLab } from "./IconLab"

export const metadata = { title: "Icon lab" }

/**
 * Dev page: the whole Untitled UI pack, one tile each, no names. The base
 * we redraw our own set from: a redrawn icon shows ours (Untitled on
 * hover) with a dot; icons the app uses sit on a darker tile.
 */
export default function IconLabPage() {
  return <IconLab />
}
