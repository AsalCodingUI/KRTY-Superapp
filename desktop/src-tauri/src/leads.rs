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
    let Some(page) = app.get_webview(crate::APP) else {
        return;
    };
    #[cfg(target_os = "macos")]
    let _ = page.with_webview(|platform| {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;
        use objc2_foundation::NSRect;
        let web = platform.inner() as *mut AnyObject;
        if web.is_null() {
            return;
        }
        unsafe {
            let parent: *mut AnyObject = msg_send![web, superview];
            if parent.is_null() {
                return;
            }
            let bounds: NSRect = msg_send![parent, bounds];
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

fn hide_all_but(app: &AppHandle, keep: Option<&str>) {
    for (name, view) in app.webviews() {
        if name.starts_with(PREFIX) && Some(name.as_str()) != keep {
            let _ = view.hide();
        }
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
    let position = LogicalPosition::new(x.max(0.0), y.max(0.0));
    let size = LogicalSize::new(width.max(1.0), height.max(1.0));
    let corners = (radius.unwrap_or(0.0), round_left.unwrap_or(false));

    let rect = (position.x, position.y, size.width, size.height);
    if let Some(view) = app.get_webview(&target) {
        place(&view, rect, corners);
        let _ = view.show();
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
    let builder = WebviewBuilder::new(&target, WebviewUrl::External(parsed))
        .user_agent(SAFARI_UA)
        // Links a site opens in a new window (Gmail's, Dribbble's shots)
        // go to the browser; the site itself stays here.
        .on_new_window(move |link, _| {
            let _ = opener.opener().open_url(link.to_string(), None::<&str>);
            NewWindowResponse::Deny
        });
    let view = window
        .add_child(builder, position, size)
        .map_err(|e| e.to_string())?;
    place(&view, rect, corners);
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
                let made: *mut AnyObject = msg_send![class!(NSView), alloc];
                let made: *mut AnyObject = msg_send![made, initWithFrame: NSRect::ZERO];
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

/// Hides every lead (the web app left its /leads page, or a dialog opened
/// over the sheet). They stay loaded.
#[tauri::command]
pub fn lead_hide(app: AppHandle) {
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
