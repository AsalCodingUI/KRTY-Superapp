/**
 * How much room a scrollbar takes here (12px with the app's styled
 * scrollbars on a desktop, 0 where they overlay, like phones), as --sbw on
 * <html>. Scrolling panes take it out of their side padding (see
 * `pane-px-*` in globals.css), so the left and right spacing match.
 * Measured as the room a `scrollbar-gutter: stable both-edges` box really
 * keeps on each side: WebKit (Safari, the Mac app) claims support but keeps
 * none, and then the panes must keep their full padding, or their content
 * would sit wider than the header and footer.
 * Runs in <head>; it measures on the first frame, once the stylesheets
 * (and their scrollbar styles) are in, before anything is painted.
 */
export const SCROLLBAR_WIDTH_SCRIPT = `(function(){function m(){try{var r=document.documentElement,d=document.createElement("div");d.style.cssText="position:absolute;top:-999px;width:100px;height:100px;overflow-y:auto;scrollbar-gutter:stable both-edges";r.appendChild(d);r.style.setProperty("--sbw",Math.max(0,(100-d.clientWidth)/2)+"px");d.remove()}catch(e){}}requestAnimationFrame(m);addEventListener("load",m)})()`
