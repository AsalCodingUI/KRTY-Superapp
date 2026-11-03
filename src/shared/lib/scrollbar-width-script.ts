/**
 * How much room a scrollbar takes here (12px with the app's styled
 * scrollbars on a desktop, 0 where they overlay, like phones), as --sbw on
 * <html>. Scrolling panes take it out of their side padding (see
 * `pane-px-*` in globals.css), so the left and right spacing match.
 * Runs in <head>; it measures on the first frame, once the stylesheets
 * (and their scrollbar styles) are in, before anything is painted.
 */
export const SCROLLBAR_WIDTH_SCRIPT = `(function(){function m(){try{var r=document.documentElement,d=document.createElement("div");d.style.cssText="position:absolute;top:-999px;width:100px;height:100px;overflow:scroll";r.appendChild(d);r.style.setProperty("--sbw",(d.offsetWidth-d.clientWidth)+"px");d.remove()}catch(e){}}requestAnimationFrame(m);addEventListener("load",m)})()`
