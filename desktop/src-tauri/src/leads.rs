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
/// (Tauri's "unstable" multi-webview) the page no longer follows the window
/// by itself: after a resize (or macOS restoring the window's last size) it
/// came out cut off on the right and bottom.
pub fn fit_page(app: &AppHandle) {
    let (Some(window), Some(page)) = (app.get_window(crate::APP), app.get_webview(crate::APP))
    else {
        return;
    };
    if let (Ok(size), Ok(scale)) = (window.inner_size(), window.scale_factor()) {
        let _ = page.set_position(LogicalPosition::new(0.0, 0.0));
        let _ = page.set_size(size.to_logical::<f64>(scale));
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

    if let Some(view) = app.get_webview(&target) {
        let _ = view.set_position(position);
        let _ = view.set_size(size);
        round(&view, corners);
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
    round(&view, corners);
    fit_page(&app);
    Ok(())
}

/// The page sheet's corners on the web view (a native view ignores the
/// page's CSS): `radius` on the right ones, and the left ones too when the
/// sidebar panel is folded (open, the view's left edge meets it). macOS's
/// continuous curve, the squircle the page's corners use.
#[cfg(target_os = "macos")]
fn round(view: &tauri::Webview, (radius, left): (f64, bool)) {
    let _ = view.with_webview(move |platform| {
        use objc2::msg_send;
        use objc2::runtime::{AnyObject, Bool};
        use objc2_foundation::NSString;
        let web = platform.inner() as *mut AnyObject;
        if web.is_null() {
            return;
        }
        unsafe {
            let _: () = msg_send![web, setWantsLayer: Bool::YES];
            let layer: *mut AnyObject = msg_send![web, layer];
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
fn round(_view: &tauri::Webview, _corners: (f64, bool)) {}

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
        let _ = view.close();
    }
}
