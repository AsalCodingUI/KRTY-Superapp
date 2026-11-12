//! Leads: the sites PMs and stakeholders keep open to find and answer leads
//! (Gmail, Telegram Web, Dribbble, Behance, their own), shown inside the app
//! window instead of the browser.
//!
//! They can't be iframes (those sites refuse to be framed), so each is a
//! native web view of its own, a child of the app window, laid exactly over
//! the web app's page sheet: the web app's /leads/<id> page reports where
//! that is (`lead_show`) and hides it again when you leave (`lead_hide`).
//! A site stays loaded while hidden, so Gmail and Telegram don't reload and
//! keep their sign-in (WebKit's persistent store).

use tauri::{
    webview::{NewWindowResponse, WebviewBuilder},
    AppHandle, LogicalPosition, LogicalSize, Manager, WebviewUrl,
};
use tauri_plugin_opener::OpenerExt;

/// Safari's own user agent: WKWebView is Safari's engine, and Google turns
/// away sign-in from user agents it reads as an embedded web view.
const SAFARI_UA: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15";

const PREFIX: &str = "lead-";

/// Runs in every site's view (and its frames' top only): the site reports
/// to the app through its one allowed command (`lead_report`, its own
/// capability): its desktop notifications (the site's Notification and
/// service worker showNotification, which a web view inside an app doesn't
/// show) and its changes (address, title), so the app's toolbar and the
/// panel's unread badges follow without polling.
const REPORTER: &str = r#"(() => {
  if (window.top !== window) return;
  const send = (kind, extra) => {
    try { window.__TAURI_INTERNALS__.invoke("lead_report", Object.assign({ kind }, extra || {})); } catch (e) {}
  };
  const notify = (title, options) =>
    send("notify", { title: String(title || ""), body: options && options.body ? String(options.body) : null });
  class LeadNotification extends EventTarget {
    constructor(title, options) {
      super();
      this.title = title;
      this.body = options && options.body;
      this.onclick = null; this.onclose = null; this.onerror = null; this.onshow = null;
      notify(title, options);
    }
    close() {}
    static get permission() { return "granted"; }
    static requestPermission(callback) { if (callback) callback("granted"); return Promise.resolve("granted"); }
  }
  try { Object.defineProperty(window, "Notification", { value: LeadNotification, configurable: true, writable: true }); } catch (e) {}
  try {
    if (window.ServiceWorkerRegistration)
      ServiceWorkerRegistration.prototype.showNotification = function (title, options) { notify(title, options); return Promise.resolve(); };
  } catch (e) {}
  let last = "", timer = 0;
  const changed = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const now = location.href + "\n" + document.title;
      if (now === last) return;
      last = now;
      send("change");
    }, 150);
  };
  for (const k of ["pushState", "replaceState"]) {
    const f = history[k];
    history[k] = function () { const r = f.apply(this, arguments); changed(); return r; };
  }
  addEventListener("popstate", changed);
  addEventListener("hashchange", changed);
  const watch = () => {
    if (!document.head) return setTimeout(watch, 300);
    new MutationObserver(changed).observe(document.head, { childList: true, subtree: true, characterData: true });
    changed();
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", watch); else watch();
})()"#;



/// A web view label from the source's id (labels allow a-z, 0-9, - …).
fn label(id: &str) -> String {
    let safe: String = id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
        .take(64)
        .collect();
    format!("{PREFIX}{safe}")
}

/// The app's own page, the whole window. With child web views enabled
/// (Tauri's "unstable" multi-webview) the page's web view no longer follows
/// the window by itself, and sizing it by hand (set_size) left WebKit
/// painting a stale, smaller part of it (cut off on the right and bottom).
/// So AppKit sizes it, as without child views: the window's content bounds
/// and width + height autoresizing.
pub fn fit_page(app: &AppHandle) {
    fit(app, false);
}

fn fit(app: &AppHandle, nudge: bool) {
    let Some(page) = app.get_webview(crate::APP) else {
        return;
    };
    #[cfg(target_os = "macos")]
    let _ = page.with_webview(move |platform| {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;
        use objc2_foundation::NSRect;
        let web = platform.inner() as *mut AnyObject;
        if web.is_null() {
            return;
        }
        MAIN_WEB.store(web as *mut std::ffi::c_void, std::sync::atomic::Ordering::Relaxed);
        unsafe {
            let parent: *mut AnyObject = msg_send![web, superview];
            if parent.is_null() {
                return;
            }
            let bounds: NSRect = msg_send![parent, bounds];
            // A frame a point short first, then the real one: WebKit then
            // takes the new size for its drawing area too. After a resize
            // (live resize pauses its painting) it sometimes kept the old
            // one, painting the page cut off at the right and bottom until
            // something repainted it.
            if nudge {
                let mut short = bounds;
                short.size.height -= 1.0;
                let _: () = msg_send![web, setFrame: short];
            }
            let _: () = msg_send![web, setFrame: bounds];
            // NSViewWidthSizable | NSViewHeightSizable
            let _: () = msg_send![web, setAutoresizingMask: 2usize | 16usize];
        }
    });
    #[cfg(not(target_os = "macos"))]
    if let Some(window) = app.get_window(crate::APP) {
        if let (Ok(size), Ok(scale)) = (window.inner_size(), window.scale_factor()) {
            let _ = page.set_position(LogicalPosition::new(0.0, 0.0));
            let _ = page.set_size(size.to_logical::<f64>(scale));
        }
    }
}

/// The window has settled after a resize: fit the page once more, a moment
/// after the last resize event (WebKit pauses painting during a live
/// resize and can miss the final size).
pub fn settle_page(app: &AppHandle) {
    use std::sync::atomic::{AtomicU64, Ordering};
    static TICK: AtomicU64 = AtomicU64::new(0);
    let mine = TICK.fetch_add(1, Ordering::SeqCst) + 1;
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(250));
        if TICK.load(Ordering::SeqCst) != mine {
            return;
        }
        let inner = handle.clone();
        let _ = handle.run_on_main_thread(move || fit(&inner, true));
    });
}

/// The site on show (its view's label), if any.
static SHOWN_LEAD: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

fn hide_all_but(app: &AppHandle, keep: Option<&str>) {
    for (name, view) in app.webviews() {
        if name.starts_with(PREFIX) && Some(name.as_str()) != keep {
            let _ = view.hide();
        }
    }
}

/// Site views kept loaded at most (each is a WebKit process; Gmail and
/// Telegram are heavy). The sign-in lives in WebKit's store, not the view,
/// so a closed one opens signed in again.
const KEEP: usize = 3;

/// `shown` becomes the most recent; views past KEEP are closed.
fn keep_recent(app: &AppHandle, shown: &str) {
    use std::sync::Mutex;
    static RECENT: Mutex<Vec<String>> = Mutex::new(Vec::new());
    let Ok(mut recent) = RECENT.lock() else { return };
    recent.retain(|l| l != shown);
    recent.insert(0, shown.to_string());
    while recent.len() > KEEP {
        if let Some(old) = recent.pop() {
            // Its wrapper and tracking area go too (lead_close).
            if app.get_webview(&old).is_some() {
                lead_close(app.clone(), old[PREFIX.len()..].to_string());
            }
        }
    }
}

/// The registrable part of a host, roughly (mail.google.com and
/// accounts.google.com → google.com; two labels, three under a two-letter
/// second level like co.uk / co.id).
fn site_of(host: &str) -> String {
    let parts: Vec<&str> = host.split('.').collect();
    let keep = if parts.len() >= 3 && parts[parts.len() - 2].len() <= 3 && parts[parts.len() - 1].len() == 2 {
        3
    } else {
        2
    };
    parts[parts.len().saturating_sub(keep)..].join(".")
}

/// Whether `link` is on the same site as the lead's own address.
fn same_site(link: &url::Url, home: &url::Url) -> bool {
    match (link.host_str(), home.host_str()) {
        (Some(a), Some(b)) => site_of(a) == site_of(b),
        _ => false,
    }
}

/// WebKit's popups (wry's Allow) get no UI delegate, so a sign-in popup's
/// window.close() did nothing and it stayed open on a blank relay page.
/// Each popup window without one borrows the lead view's delegate, taught
/// `webViewDidClose:` (close the web view's window).
#[cfg(target_os = "macos")]
fn adopt_popups(app: &AppHandle, lead: &str) {
    let Some(view) = app.get_webview(lead) else { return };
    let _ = view.with_webview(|platform| unsafe {
        use objc2::runtime::{AnyClass, AnyObject, Bool, Sel};
        use objc2::{class, msg_send, sel};
        let web = platform.inner() as *mut AnyObject;
        if web.is_null() {
            return;
        }
        let delegate: *mut AnyObject = msg_send![web, UIDelegate];
        if delegate.is_null() {
            return;
        }
        let name = sel!(webViewDidClose:);
        let has: Bool = msg_send![delegate, respondsToSelector: name];
        if !has.as_bool() {
            unsafe extern "C-unwind" fn did_close(_this: *mut AnyObject, _cmd: Sel, web: *mut AnyObject) {
                let window: *mut AnyObject = msg_send![web, window];
                if !window.is_null() {
                    let _: () = msg_send![window, performClose: std::ptr::null_mut::<AnyObject>()];
                }
            }
            let cls: *const AnyClass = msg_send![delegate, class];
            let imp: objc2::runtime::Imp = std::mem::transmute(
                did_close as unsafe extern "C-unwind" fn(*mut AnyObject, Sel, *mut AnyObject),
            );
            objc2::ffi::class_addMethod(cls as *mut AnyClass, name, imp, c"v@:@".as_ptr());
        }
        let ns_app: *mut AnyObject = msg_send![class!(NSApplication), sharedApplication];
        let windows: *mut AnyObject = msg_send![ns_app, windows];
        let count: usize = msg_send![windows, count];
        let wk = class!(WKWebView);
        for i in 0..count {
            let window: *mut AnyObject = msg_send![windows, objectAtIndex: i];
            let content: *mut AnyObject = msg_send![window, contentView];
            if content.is_null() {
                continue;
            }
            let is_web: Bool = msg_send![content, isKindOfClass: wk];
            if !is_web.as_bool() {
                continue;
            }
            let current: *mut AnyObject = msg_send![content, UIDelegate];
            if current.is_null() {
                let _: () = msg_send![content, setUIDelegate: delegate];
            }
        }
    });
}

/// ~/Downloads.
fn downloads_dir() -> Option<std::path::PathBuf> {
    std::env::var_os("HOME").map(|h| std::path::PathBuf::from(h).join("Downloads"))
}

/// `dir/name`, or `name (1)`, `name (2)` … when that's taken.
fn free_path(dir: &std::path::Path, name: &str) -> std::path::PathBuf {
    let first = dir.join(name);
    if !first.exists() {
        return first;
    }
    let (stem, ext) = match name.rsplit_once('.') {
        Some((s, e)) if !s.is_empty() => (s.to_string(), format!(".{e}")),
        _ => (name.to_string(), String::new()),
    };
    (1..1000)
        .map(|i| dir.join(format!("{stem} ({i}){ext}")))
        .find(|p| !p.exists())
        .unwrap_or_else(|| {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_or(0, |d| d.as_millis());
            dir.join(format!("{stem} ({now}){ext}"))
        })
}

/// A downloaded file's name, safe to save: no bidi controls (which can
/// disguise an extension), and none of the types macOS runs or opens as an
/// app when double-clicked (a site could drop one and then open it).
fn safe_download_name(name: &str) -> Option<String> {
    let clean: String = name
        .chars()
        .filter(|c| !matches!(c, '\u{202A}'..='\u{202E}' | '\u{2066}'..='\u{2069}' | '\u{200E}' | '\u{200F}'))
        .collect();
    let ext = clean.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase()).unwrap_or_default();
    const RUNNABLE: &[&str] = &[
        "app", "command", "terminal", "tool", "pkg", "mpkg", "workflow", "action",
        "fileloc", "webloc", "inetloc", "scpt", "scptd", "applescript", "jar", "sh",
        "dmg", "prefpane", "kext", "plugin", "osax", "definition", "shortcut",
    ];
    (!RUNNABLE.contains(&ext.as_str())).then_some(clean)
}

/// Marks a downloaded file as from the internet (Gatekeeper asks before
/// anything in it runs), as a browser does.
#[cfg(target_os = "macos")]
fn quarantine(path: &std::path::Path) {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_secs());
    let _ = std::process::Command::new("/usr/bin/xattr")
        .arg("-w")
        .arg("com.apple.quarantine")
        .arg(format!("0083;{now:x};Kretya Flow;"))
        .arg(path)
        .status();
}

/// A link a site may hand to the system: web and mail only (never file:,
/// smb:, another app's scheme or the app's own sign-in link).
fn openable(link: &url::Url) -> bool {
    matches!(link.scheme(), "http" | "https" | "mailto")
}

/// Where a site's own view may go: https pages, never the app's own pages
/// or this Mac's (their commands are the app's, not a site's).
fn site_may_load(link: &url::Url) -> bool {
    match link.scheme() {
        "about" | "blob" | "data" => true,
        "https" => {
            let app = url::Url::parse(crate::app_url()).ok();
            let host = link.host_str().unwrap_or("");
            app.map_or(true, |a| a.origin() != link.origin())
                && host != "localhost"
                && host != "tauri.localhost"
                && !host.starts_with("127.")
                && host != "[::1]"
        }
        _ => false,
    }
}

/// Shows the site `id` (`url`, https only) at the given rect of the app
/// window (CSS pixels from the window's top left), making its web view on
/// first use; every other lead is hidden.
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn lead_show(
    app: AppHandle,
    id: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    radius: Option<f64>,
    round_left: Option<bool>,
) -> Result<(), String> {
    let target = label(&id);
    hide_all_but(&app, Some(&target));
    if let Ok(mut shown) = SHOWN_LEAD.lock() {
        *shown = Some(target.clone());
    }
    keep_recent(&app, &target);
    let position = LogicalPosition::new(x.max(0.0), y.max(0.0));
    let size = LogicalSize::new(width.max(1.0), height.max(1.0));
    let corners = (radius.unwrap_or(0.0), round_left.unwrap_or(false));

    let rect = (position.x, position.y, size.width, size.height);
    if let Some(view) = app.get_webview(&target) {
        place(&view, rect, corners);
        let _ = view.show();
        focus(&view);
        return Ok(());
    }

    let parsed: url::Url = url.parse().map_err(|_| "invalid url".to_string())?;
    if parsed.scheme() != "https" {
        return Err("https only".into());
    }
    let window = app
        .get_window(crate::APP)
        .ok_or_else(|| "no app window".to_string())?;
    let opener = app.clone();
    let home = parsed.clone();
    let view_label = target.clone();
    let page_app = app.clone();
    let builder = WebviewBuilder::new(&target, WebviewUrl::External(parsed))
        .user_agent(SAFARI_UA)
        .initialization_script(REPORTER)
        // Loading starts / ends: the toolbar's reload ↔ stop and its bar.
        .on_page_load(move |view, _payload| {
            let app = page_app.clone();
            let label = view.label().to_string();
            tauri::async_runtime::spawn(async move { emit_state(&app, &label).await });
        })
        // A new window from the site: a sign-in popup stays in the app
        // (sharing the site's session and opener, so the flow completes), a
        // tab on the site's own domain opens in the site's view (Gmail's
        // "Add account" on accounts.google.com), anything else goes to the
        // browser (Dribbble's shots linking out).
        .on_new_window(move |link, features| {
            // WebKit's own popup (wry's default: a window with a web view on
            // the configuration WebKit hands over, which keeps the opener and
            // the session; a web view made by Tauri for it stayed blank).
            if features.size().is_some() {
                #[cfg(target_os = "macos")]
                {
                    // Once wry has made it: let it close itself.
                    let app = opener.clone();
                    let label = view_label.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(300));
                        let inner = app.clone();
                        let _ = app.run_on_main_thread(move || adopt_popups(&inner, &label));
                    });
                }
                return NewWindowResponse::Allow;
            }
            if same_site(&link, &home) {
                let app = opener.clone();
                let label = view_label.clone();
                let _ = opener.run_on_main_thread(move || {
                    if let Some(view) = app.get_webview(&label) {
                        let _ = view.navigate(link);
                    }
                });
                return NewWindowResponse::Deny;
            }
            if openable(&link) {
                let _ = opener.opener().open_url(link.to_string(), None::<&str>);
            }
            NewWindowResponse::Deny
        })
        .on_navigation(|link| site_may_load(link));
    // Files a site downloads (Gmail's attachments) land in Downloads, under
    // a name that doesn't overwrite one already there; a notification says
    // when they're in.
    let builder = builder.on_download(|_view, event| {
        match event {
            tauri::webview::DownloadEvent::Requested { url, destination } => {
                if let Some(dir) = downloads_dir() {
                    let name = destination
                        .file_name()
                        .map(|n| n.to_string_lossy().into_owned())
                        .filter(|n| !n.is_empty())
                        .or_else(|| {
                            url.path_segments()
                                .and_then(|mut s| s.next_back().map(str::to_string))
                                .filter(|n| !n.is_empty())
                        })
                        .unwrap_or_else(|| "download".to_string());
                    let Some(name) = safe_download_name(&name) else {
                        return false;
                    };
                    *destination = free_path(&dir, &name);
                }
            }
            tauri::webview::DownloadEvent::Finished { success, path, .. } => {
                #[cfg(target_os = "macos")]
                if let Some(path) = path.as_deref() {
                    quarantine(path);
                }
                #[cfg(target_os = "macos")]
                if success {
                    crate::mac_notify::show("Unduhan selesai", "Tersimpan di folder Downloads.", None, None);
                }
                #[cfg(not(target_os = "macos"))]
                let _ = success;
            }
            _ => {}
        }
        true
    });
    let view = window
        .add_child(builder, position, size)
        .map_err(|e| e.to_string())?;
    place(&view, rect, corners);
    focus(&view);
    fit_page(&app);
    Ok(())
}

/// Lays the site's web view over `rect` (CSS pixels from the window's top
/// left) with the page sheet's corners (a native view ignores the page's
/// CSS): `radius` on the right ones, and the left ones too when the sidebar
/// panel is folded; macOS's continuous curve, the squircle the page uses.
///
/// The corners are a plain wrapper NSView's (its layer rounds and clips),
/// never the WKWebView's own layer: WebKit composites its content in layers
/// of its own and re-promotes them on hover, and a mask on the web view
/// itself then paints in pieces. The web view fills the wrapper, untouched.
#[cfg(target_os = "macos")]
fn place(view: &tauri::Webview, rect: (f64, f64, f64, f64), (radius, left): (f64, bool)) {
    let _ = view.with_webview(move |platform| {
        use objc2::runtime::{AnyObject, Bool};
        use objc2::{class, msg_send};
        use objc2_foundation::{NSPoint, NSRect, NSSize, NSString};
        let web = platform.inner() as *mut AnyObject;
        if web.is_null() {
            return;
        }
        let id = NSString::from_str(WRAP);
        unsafe {
            let mut wrap: *mut AnyObject = msg_send![web, superview];
            if wrap.is_null() {
                return;
            }
            let ident: *mut AnyObject = msg_send![wrap, identifier];
            let wrapped = !ident.is_null() && {
                let same: Bool = msg_send![ident, isEqualToString: &*id];
                same.as_bool()
            };
            if !wrapped {
                // First time: move the web view into a wrapper at its place
                // in the window (kept alive across the move).
                let content = wrap;
                let _: *mut AnyObject = msg_send![web, retain];
                let made: *mut AnyObject = msg_send![wrap_class(), alloc];
                let made: *mut AnyObject = msg_send![made, initWithFrame: NSRect::ZERO];
                // The mouse entering / leaving the site moves the window's
                // focus with it (wrap_class).
                let options: usize = 0x01 | 0x80 | 0x200; // entered/exited, always, in visible rect
                let area: *mut AnyObject = msg_send![class!(NSTrackingArea), alloc];
                let area: *mut AnyObject = msg_send![area, initWithRect: NSRect::ZERO, options: options, owner: made, userInfo: std::ptr::null_mut::<AnyObject>()];
                let _: () = msg_send![made, addTrackingArea: area];
                let _: () = msg_send![area, release];
                let _: () = msg_send![made, setIdentifier: &*id];
                let _: () = msg_send![made, setWantsLayer: Bool::YES];
                // Above the app's page, where the web view was.
                let _: () = msg_send![content, addSubview: made, positioned: 1isize, relativeTo: web];
                let _: () = msg_send![web, removeFromSuperview];
                let _: () = msg_send![made, addSubview: web];
                let _: () = msg_send![web, release];
                let _: () = msg_send![made, release];
                // Whatever an older build set on the web view's own layer.
                let layer: *mut AnyObject = msg_send![web, layer];
                if !layer.is_null() {
                    let _: () = msg_send![layer, setCornerRadius: 0f64];
                    let _: () = msg_send![layer, setMasksToBounds: Bool::NO];
                }
                wrap = made;
            }
            let content: *mut AnyObject = msg_send![wrap, superview];
            if content.is_null() {
                return;
            }
            // AppKit's y runs up unless the view is flipped.
            let flipped: Bool = msg_send![content, isFlipped];
            let bounds: NSRect = msg_send![content, bounds];
            let (x, y, w, h) = rect;
            let top = if flipped.as_bool() {
                y
            } else {
                bounds.size.height - y - h
            };
            let frame = NSRect::new(NSPoint::new(x, top), NSSize::new(w, h));
            let _: () = msg_send![wrap, setFrame: frame];
            let inner = NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(w, h));
            let _: () = msg_send![web, setFrame: inner];
            // NSViewWidthSizable | NSViewHeightSizable
            let _: () = msg_send![web, setAutoresizingMask: 2usize | 16usize];
            let layer: *mut AnyObject = msg_send![wrap, layer];
            if layer.is_null() {
                return;
            }
            let _: () = msg_send![layer, setCornerRadius: radius];
            let _: () = msg_send![layer, setMasksToBounds: Bool::new(radius > 0.0)];
            let curve = NSString::from_str("continuous");
            let _: () = msg_send![layer, setCornerCurve: &*curve];
            // CACornerMask: min-x = left, max-x = right (both y edges).
            let mask: usize = if left { 1 | 2 | 4 | 8 } else { 2 | 8 };
            let _: () = msg_send![layer, setMaskedCorners: mask];
        }
    });
}

#[cfg(not(target_os = "macos"))]
fn place(view: &tauri::Webview, (x, y, w, h): (f64, f64, f64, f64), _corners: (f64, bool)) {
    let _ = view.set_position(LogicalPosition::new(x, y));
    let _ = view.set_size(LogicalSize::new(w, h));
}

/// The site's view takes the window's focus when it's shown (as a browser
/// pane does): AppKit sends mouse moves and keys to the first responder,
/// and with the app's page holding it the site got no hover (rows, menus,
/// tooltips) until clicked.
#[cfg(target_os = "macos")]
fn focus(view: &tauri::Webview) {
    let _ = view.with_webview(|platform| unsafe {
        use objc2::msg_send;
        use objc2::runtime::{AnyObject, Bool};
        let web = platform.inner() as *mut AnyObject;
        if web.is_null() {
            return;
        }
        let window: *mut AnyObject = msg_send![web, window];
        if window.is_null() {
            return;
        }
        let _: () = msg_send![window, setAcceptsMouseMovedEvents: Bool::YES];
        // Safari's trackpad gestures: two-finger swipe back / forward,
        // pinch to zoom.
        let _: () = msg_send![web, setAllowsBackForwardNavigationGestures: Bool::YES];
        let _: () = msg_send![web, setAllowsMagnification: Bool::YES];
        // Already the site's (or a view inside it, its page): nothing to do,
        // so a re-placement doesn't bounce the focus.
        let current: *mut AnyObject = msg_send![window, firstResponder];
        if current == web {
            return;
        }
        // The first responder can be the window itself (not a view, no
        // isDescendantOf:): ask only a responder that understands it.
        if !current.is_null() {
            let is_view: Bool =
                msg_send![current, respondsToSelector: objc2::sel!(isDescendantOf:)];
            if is_view.as_bool() {
                let inside: Bool = msg_send![current, isDescendantOf: web];
                if inside.as_bool() {
                    return;
                }
            }
        }
        let _: Bool = msg_send![window, makeFirstResponder: web];
    });
}

#[cfg(not(target_os = "macos"))]
fn focus(view: &tauri::Webview) {
    let _ = view.set_focus();
}

/// The app's own page (its web view), for handing the focus back.
#[cfg(target_os = "macos")]
static MAIN_WEB: std::sync::atomic::AtomicPtr<std::ffi::c_void> =
    std::sync::atomic::AtomicPtr::new(std::ptr::null_mut());

/// The window's focus (where AppKit sends mouse moves and keys, so where
/// hover works) follows the mouse: onto a site, the site's view; off it,
/// the app's page (else the sidebar and every page lost their hover, and
/// the resize grip stayed lit, after visiting a site).
#[cfg(target_os = "macos")]
/// Tells the page the mouse is away on a site (`data-pointer-away` on its
/// root) or back: it never sees the mouse leave, so whatever it last
/// hovered (the resize grip) would stay lit.
#[cfg(target_os = "macos")]
fn mark_page(away: bool) {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;
    use objc2_foundation::NSString;
    let web = MAIN_WEB.load(std::sync::atomic::Ordering::Relaxed) as *mut AnyObject;
    if web.is_null() {
        return;
    }
    let script = NSString::from_str(if away {
        "document.documentElement.setAttribute('data-pointer-away','')"
    } else {
        "document.documentElement.removeAttribute('data-pointer-away')"
    });
    unsafe {
        let _: () = msg_send![web, evaluateJavaScript: &*script, completionHandler: std::ptr::null_mut::<AnyObject>()];
    }
}

#[cfg(target_os = "macos")]
fn focus_page() {
    use objc2::msg_send;
    use objc2::runtime::{AnyObject, Bool};
    let web = MAIN_WEB.load(std::sync::atomic::Ordering::Relaxed) as *mut AnyObject;
    if web.is_null() {
        return;
    }
    unsafe {
        let window: *mut AnyObject = msg_send![web, window];
        if !window.is_null() {
            let _: Bool = msg_send![window, makeFirstResponder: web];
        }
    }
}

/// The wrapper's class: an NSView whose tracking area hands the focus to
/// its site on entry and back to the page on exit.
#[cfg(target_os = "macos")]
fn wrap_class() -> &'static objc2::runtime::AnyClass {
    use objc2::runtime::{AnyClass, AnyObject, Bool, ClassBuilder, Sel};
    use objc2::{class, msg_send, sel};
    use std::sync::OnceLock;
    static CLASS: OnceLock<&'static AnyClass> = OnceLock::new();
    CLASS.get_or_init(|| {
        let mut builder = ClassBuilder::new(c"KrtyLeadWrap", class!(NSView))
            .expect("KrtyLeadWrap is registered once");
        unsafe extern "C-unwind" fn entered(this: *mut AnyObject, _cmd: Sel, _event: *mut AnyObject) {
            let subviews: *mut AnyObject = msg_send![this, subviews];
            let count: usize = msg_send![subviews, count];
            if count == 0 {
                return;
            }
            let web: *mut AnyObject = msg_send![subviews, objectAtIndex: 0usize];
            let hidden: Bool = msg_send![web, isHidden];
            let window: *mut AnyObject = msg_send![this, window];
            if !hidden.as_bool() && !window.is_null() {
                let _: Bool = msg_send![window, makeFirstResponder: web];
                mark_page(true);
            }
        }
        unsafe extern "C-unwind" fn exited(_this: *mut AnyObject, _cmd: Sel, _event: *mut AnyObject) {
            focus_page();
            mark_page(false);
        }
        unsafe {
            builder.add_method(
                sel!(mouseEntered:),
                entered as unsafe extern "C-unwind" fn(*mut AnyObject, Sel, *mut AnyObject),
            );
            builder.add_method(
                sel!(mouseExited:),
                exited as unsafe extern "C-unwind" fn(*mut AnyObject, Sel, *mut AnyObject),
            );
        }
        builder.register()
    })
}

/// The wrapper NSView's identifier (see `place`).
#[cfg(target_os = "macos")]
const WRAP: &str = "krty-lead-wrap";

/// A picture of the site as it is (a JPEG), for the page to show in its
/// place while an overlay (a menu, a tooltip, a dialog) needs the view out
/// of the way: the site looks frozen for a moment instead of gone.
#[tauri::command]
pub async fn lead_snapshot(app: AppHandle, id: String) -> Result<tauri::ipc::Response, String> {
    let view = app
        .get_webview(&label(&id))
        .ok_or_else(|| "no such lead".to_string())?;
    let (tx, rx) = std::sync::mpsc::channel::<Option<Vec<u8>>>();
    view.with_webview(move |platform| snapshot(platform, tx))
        .map_err(|e| e.to_string())?;
    let bytes = tauri::async_runtime::spawn_blocking(move || {
        rx.recv_timeout(std::time::Duration::from_millis(1500))
            .ok()
            .flatten()
    })
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "no snapshot".to_string())?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg(target_os = "macos")]
fn snapshot(
    platform: tauri::webview::PlatformWebview,
    tx: std::sync::mpsc::Sender<Option<Vec<u8>>>,
) {
    use block2::RcBlock;
    use objc2::msg_send;
    use objc2::runtime::AnyObject;
    let web = platform.inner() as *mut AnyObject;
    if web.is_null() {
        let _ = tx.send(None);
        return;
    }
    let tx = std::sync::Mutex::new(Some(tx));
    let done = RcBlock::new(move |image: *mut AnyObject, _error: *mut AnyObject| {
        let bytes = if image.is_null() {
            None
        } else {
            unsafe { jpeg(image) }
        };
        if let Some(tx) = tx.lock().ok().and_then(|mut t| t.take()) {
            let _ = tx.send(bytes);
        }
    });
    unsafe {
        let _: () = msg_send![
            web,
            takeSnapshotWithConfiguration: std::ptr::null_mut::<AnyObject>(),
            completionHandler: &*done
        ];
    }
}

/// An NSImage as JPEG bytes (quality 0.75: small and quick, it's only on
/// screen for a moment).
#[cfg(target_os = "macos")]
unsafe fn jpeg(image: *mut objc2::runtime::AnyObject) -> Option<Vec<u8>> {
    use objc2::runtime::AnyObject;
    use objc2::{class, msg_send};
    use objc2_foundation::NSString;
    let tiff: *mut AnyObject = msg_send![image, TIFFRepresentation];
    if tiff.is_null() {
        return None;
    }
    let rep: *mut AnyObject = msg_send![class!(NSBitmapImageRep), imageRepWithData: tiff];
    if rep.is_null() {
        return None;
    }
    let key = NSString::from_str("NSImageCompressionFactor");
    let quality: *mut AnyObject = msg_send![class!(NSNumber), numberWithDouble: 0.75f64];
    let props: *mut AnyObject =
        msg_send![class!(NSDictionary), dictionaryWithObject: quality, forKey: &*key];
    // NSBitmapImageFileTypeJPEG
    let data: *mut AnyObject = msg_send![rep, representationUsingType: 3usize, properties: props];
    if data.is_null() {
        return None;
    }
    let len: usize = msg_send![data, length];
    let ptr: *const u8 = msg_send![data, bytes];
    if ptr.is_null() || len == 0 {
        return None;
    }
    Some(std::slice::from_raw_parts(ptr, len).to_vec())
}

#[cfg(not(target_os = "macos"))]
fn snapshot(
    _platform: tauri::webview::PlatformWebview,
    tx: std::sync::mpsc::Sender<Option<Vec<u8>>>,
) {
    let _ = tx.send(None);
}

/// Gives the shown site the window's focus again (the mouse went from the
/// app's page onto it), so it has hover and keys without a click.
#[tauri::command]
pub fn lead_focus(app: AppHandle, id: String) {
    if let Some(view) = app.get_webview(&label(&id)) {
        focus(&view);
    }
}

/// The site's own back / forward / reload (the web app's toolbar over it).
#[tauri::command]
pub fn lead_nav(app: AppHandle, id: String, action: String) -> Result<(), String> {
    let view = app
        .get_webview(&label(&id))
        .ok_or_else(|| "no such lead".to_string())?;
    let script = match action.as_str() {
        "back" => "history.back()",
        "forward" => "history.forward()",
        "reload" => "location.reload()",
        "stop" => "window.stop()",
        _ => return Err("unknown action".into()),
    };
    view.eval(script).map_err(|e| e.to_string())
}

/// What the toolbar shows for a site: where it is, its title (Gmail's and
/// Telegram's carry an unread count), whether it can go back / forward and
/// whether it's loading. One cheap read of the web view's own properties.
#[derive(serde::Serialize, Default)]
pub struct LeadState {
    url: Option<String>,
    title: Option<String>,
    back: bool,
    forward: bool,
    loading: bool,
}

#[tauri::command]
pub async fn lead_state(app: AppHandle, id: String) -> Result<LeadState, String> {
    let view = app
        .get_webview(&label(&id))
        .ok_or_else(|| "no such lead".to_string())?;
    let (tx, rx) = std::sync::mpsc::channel::<LeadState>();
    view.with_webview(move |platform| {
        let _ = tx.send(read_state(platform));
    })
    .map_err(|e| e.to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        rx.recv_timeout(std::time::Duration::from_millis(500)).unwrap_or_default()
    })
    .await
    .map_err(|e| e.to_string())
}

#[cfg(target_os = "macos")]
fn read_state(platform: tauri::webview::PlatformWebview) -> LeadState {
    use objc2::msg_send;
    use objc2::runtime::{AnyObject, Bool};
    let web = platform.inner() as *mut AnyObject;
    if web.is_null() {
        return LeadState::default();
    }
    unsafe {
        let string = |obj: *mut AnyObject| -> Option<String> {
            if obj.is_null() {
                return None;
            }
            let utf8: *const std::ffi::c_char = msg_send![obj, UTF8String];
            (!utf8.is_null())
                .then(|| std::ffi::CStr::from_ptr(utf8).to_string_lossy().into_owned())
        };
        let url: *mut AnyObject = msg_send![web, URL];
        let abs: *mut AnyObject = if url.is_null() { url } else { msg_send![url, absoluteString] };
        let title: *mut AnyObject = msg_send![web, title];
        let back: Bool = msg_send![web, canGoBack];
        let forward: Bool = msg_send![web, canGoForward];
        let loading: Bool = msg_send![web, isLoading];
        LeadState {
            url: string(abs),
            title: string(title),
            back: back.as_bool(),
            forward: forward.as_bool(),
            loading: loading.as_bool(),
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn read_state(_platform: tauri::webview::PlatformWebview) -> LeadState {
    LeadState::default()
}

/// A site's state to the app's page (`lead-state`, with its id).
async fn emit_state(app: &AppHandle, label_: &str) {
    use tauri::Emitter;
    let Some(view) = app.get_webview(label_) else { return };
    let (tx, rx) = std::sync::mpsc::channel::<LeadState>();
    if view.with_webview(move |p| { let _ = tx.send(read_state(p)); }).is_err() {
        return;
    }
    let state = tauri::async_runtime::spawn_blocking(move || {
        rx.recv_timeout(std::time::Duration::from_millis(500)).unwrap_or_default()
    })
    .await
    .unwrap_or_default();
    let id = label_.strip_prefix(PREFIX).unwrap_or(label_).to_string();
    let _ = app.emit("lead-state", serde_json::json!({ "id": id, "state": state }));
}

/// What a site reports (REPORTER): a desktop notification (shown as the
/// app's, opening the site in the app on click; not while you're looking
/// at that site), or a change (address, title) for the toolbar and badges.
#[tauri::command]
pub async fn lead_report(
    app: AppHandle,
    webview: tauri::Webview,
    kind: String,
    title: Option<String>,
    body: Option<String>,
) -> Result<(), String> {
    let label_ = webview.label().to_string();
    if !label_.starts_with(PREFIX) {
        return Err("not a lead".into());
    }
    match kind.as_str() {
        "change" => emit_state(&app, &label_).await,
        "notify" => {
            use std::collections::HashMap;
            use std::sync::Mutex;
            use std::time::Instant;
            // At most one every 1.5s per site (a burst of messages), and
            // 20 a minute from them all.
            static LAST: Mutex<Option<HashMap<String, Instant>>> = Mutex::new(None);
            if let Ok(mut last) = LAST.lock() {
                let map = last.get_or_insert_with(HashMap::new);
                if map.get(&label_).is_some_and(|t| t.elapsed().as_millis() < 1500) {
                    return Ok(());
                }
                map.insert(label_.clone(), Instant::now());
            }
            static MINUTE: Mutex<Vec<Instant>> = Mutex::new(Vec::new());
            if let Ok(mut recent) = MINUTE.lock() {
                recent.retain(|t| t.elapsed().as_secs() < 60);
                if recent.len() >= 20 {
                    return Ok(());
                }
                recent.push(Instant::now());
            }
            // Looking at that very site in the focused app: no banner.
            let looking = app
                .get_window(crate::APP)
                .and_then(|w| w.is_focused().ok())
                .unwrap_or(false)
                && SHOWN_LEAD.lock().ok().and_then(|s| s.clone()).as_deref() == Some(label_.as_str());
            if looking {
                return Ok(());
            }
            let id = label_.strip_prefix(PREFIX).unwrap_or(&label_).to_string();
            // Short, as a site's own banner would be (no page-long text).
            let clip = |t: String, n: usize| t.chars().take(n).collect::<String>();
            let title = title
                .filter(|t| !t.trim().is_empty())
                .map(|t| clip(t, 100))
                .unwrap_or_else(|| "Leads".into());
            let body = body.map(|b| clip(b, 300));
            #[cfg(target_os = "macos")]
            crate::mac_notify::show(&title, body.as_deref().unwrap_or(""), Some(&format!("/leads/{id}")), None);
            #[cfg(not(target_os = "macos"))]
            let _ = (title, body, id);
        }
        _ => {}
    }
    Ok(())
}

/// Hides every lead (the web app left its /leads page, or a dialog opened
/// over the sheet). They stay loaded.
#[tauri::command]
pub fn lead_hide(app: AppHandle) {
    if let Ok(mut shown) = SHOWN_LEAD.lock() {
        *shown = None;
    }
    // The hidden site mustn't keep the window's focus (and the page's hover).
    #[cfg(target_os = "macos")]
    {
        let app2 = app.clone();
        let _ = app.run_on_main_thread(move || {
            let _ = app2;
            focus_page();
            mark_page(false);
        });
    }
    hide_all_but(&app, None);
}

/// Closes one lead's web view (its source was removed).
#[tauri::command]
pub fn lead_close(app: AppHandle, id: String) {
    if let Some(view) = app.get_webview(&label(&id)) {
        // Its wrapper (see `place`) goes too.
        #[cfg(target_os = "macos")]
        let _ = view.with_webview(|platform| unsafe {
            use objc2::msg_send;
            use objc2::runtime::AnyObject;
            let web = platform.inner() as *mut AnyObject;
            if web.is_null() {
                return;
            }
            let wrap: *mut AnyObject = msg_send![web, superview];
            if !wrap.is_null() {
                let ident: *mut AnyObject = msg_send![wrap, identifier];
                if !ident.is_null() {
                    let _: () = msg_send![wrap, removeFromSuperview];
                }
            }
        });
        let _ = view.close();
    }
}

/// Signed out of Kretya: every lead view closes and the sites' own data
/// (their cookies and storage: the studio's Gmail, Telegram …) goes, so
/// the next person at this Mac can't open them without signing in again.
/// The app's own site keeps its data (its sign-in page, preferences).
#[tauri::command]
pub fn leads_reset(app: AppHandle) {
    if let Ok(mut shown) = SHOWN_LEAD.lock() {
        *shown = None;
    }
    let labels: Vec<String> = app
        .webviews()
        .into_keys()
        .filter(|l| l.starts_with(PREFIX))
        .collect();
    for l in labels {
        lead_close(app.clone(), l[PREFIX.len()..].to_string());
    }
    #[cfg(target_os = "macos")]
    {
        let app_host = url::Url::parse(crate::app_url())
            .ok()
            .and_then(|u| u.host_str().map(str::to_string))
            .unwrap_or_default();
        let _ = app.run_on_main_thread(move || {
            focus_page();
            mark_page(false);
            unsafe { clear_site_data(app_host) };
        });
    }
}

/// Removes every site's website data except the app's own host (a record's
/// display name is its registrable domain: google.com, localhost …).
#[cfg(target_os = "macos")]
unsafe fn clear_site_data(app_host: String) {
    use block2::RcBlock;
    use objc2::msg_send;
    use objc2::runtime::{AnyClass, AnyObject};
    use objc2_foundation::NSString;
    let Some(store_class) = AnyClass::get(c"WKWebsiteDataStore") else {
        return;
    };
    let store: *mut AnyObject = msg_send![store_class, defaultDataStore];
    let types: *mut AnyObject = msg_send![store_class, allWebsiteDataTypes];
    if store.is_null() || types.is_null() {
        return;
    }
    let found = RcBlock::new(move |records: *mut AnyObject| {
        if records.is_null() {
            return;
        }
        let Some(array_class) = AnyClass::get(c"NSMutableArray") else {
            return;
        };
        let doomed: *mut AnyObject = msg_send![array_class, array];
        let count: usize = msg_send![records, count];
        for i in 0..count {
            let record: *mut AnyObject = msg_send![records, objectAtIndex: i];
            let name: *mut NSString = msg_send![record, displayName];
            let keep = !name.is_null() && {
                let name = (*name).to_string();
                !name.is_empty() && (app_host == name || app_host.ends_with(&format!(".{name}")))
            };
            if !keep {
                let _: () = msg_send![doomed, addObject: record];
            }
        }
        let store: *mut AnyObject = msg_send![store_class, defaultDataStore];
        let types: *mut AnyObject = msg_send![store_class, allWebsiteDataTypes];
        let done = RcBlock::new(|| {});
        let _: () = msg_send![
            store,
            removeDataOfTypes: types,
            forDataRecords: doomed,
            completionHandler: &*done
        ];
    });
    let _: () = msg_send![store, fetchDataRecordsOfTypes: types, completionHandler: &*found];
}
