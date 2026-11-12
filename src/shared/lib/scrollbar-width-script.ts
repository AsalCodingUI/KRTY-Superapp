/**
 * How much room a scrollbar takes here on each side of a
 * `scrollbar-gutter: stable both-edges` box (12px with the app's styled
 * scrollbars on a desktop, 0 where they overlay, like phones), as --sbw on
 * <html>. Scrolling panes take it out of their side padding (see
 * `pane-px-*` in globals.css), so the left and right spacing match.
 * Measured from the content box of a scrolling probe, not its clientWidth:
 * WebKit (Safari, the Mac app) keeps the room on both sides but counts only
 * the right one in clientWidth, which halved it to 6px.
 * Runs in <head> (at once, when parsed, on the first frame and on load:
 * the stylesheets' scrollbar styles change the width) and again after
 * hydration (ThemeColorSync), which drops <html>'s inline style; without
 * it the right side came out 12–24px wider than the left in the Mac app.
 */
const MEASURE = `function(){try{var r=document.documentElement,d=document.createElement("div"),c=document.createElement("div");d.style.cssText="position:absolute;top:-999px;left:0;width:100px;height:50px;overflow-y:scroll;scrollbar-gutter:stable both-edges;visibility:hidden";c.style.height="100px";d.appendChild(c);r.appendChild(d);var w=Math.max(0,(100-c.getBoundingClientRect().width)/2);d.remove();r.style.setProperty("--sbw",w+"px")}catch(e){}}`

export const SCROLLBAR_WIDTH_SCRIPT = `(function(){var m=${MEASURE};m();requestAnimationFrame(m);addEventListener("DOMContentLoaded",m);addEventListener("load",m)})()`

/** Measure again, the same way (after hydration replaced <html>'s inline
 *  style, or where the head script never ran: a client-rendered root). */
export function remeasureScrollbarWidth() {
  const root = document.documentElement
  const box = document.createElement("div")
  const content = document.createElement("div")
  box.style.cssText =
    "position:absolute;top:-999px;left:0;width:100px;height:50px;overflow-y:scroll;scrollbar-gutter:stable both-edges;visibility:hidden"
  content.style.height = "100px"
  box.appendChild(content)
  root.appendChild(box)
  const width = Math.max(0, (100 - content.getBoundingClientRect().width) / 2)
  box.remove()
  root.style.setProperty("--sbw", `${width}px`)
}
