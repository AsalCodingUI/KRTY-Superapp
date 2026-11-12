//! Leads: the sites PMs and stakeholders keep open to find and answer leads
//! (Gmail, Telegram Web, Dribbble, Behance, their own), shown inside the app
//! instead of the browser.
//!
//! They can't be iframes (those sites refuse to be framed), and child web
//! views inside the app window (Tauri's "unstable" multi-webview) broke the
//! app's own page painting over the window's blur. So each site is a small
//! borderless window of its own, a child of the app window (it moves,
//! hides and minimizes with it), laid exactly over the web app's page
//! sheet: the web app's /leads/<id> page reports where that is
//! (`lead_show`) and hides it again when you leave (`lead_hide`). A site
//! stays loaded while hidden, so Gmail and Telegram don't reload and keep
//! their sign-in (WebKit's persistent store).

use std::sync::Mutex;

use tauri::{
    webview::NewWindowResponse, AppHandle, LogicalPosition, LogicalSize, Manager, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder,
};
use tauri_plugin_opener::OpenerExt;

/// Safari's own user agent: WKWebView is Safari's engine, and Google turns
/// away sign-in from user agents it reads as an embedded web view.
const SAFARI_UA: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15";

const PREFIX: &str = "lead-";

/// The lead on show and where (in the app window, CSS pixels), so it can
/// follow the window as it moves or resizes.
#[derive(Clone)]
struct Placement {
    label: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

static SHOWN: Mutex<Option<Placement>> = Mutex::new(None);

/// A window label from the source's id (labels allow a-z, 0-9, - …).
fn label(id: &str) -> String {
    let safe: String = id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
        .take(64)
        .collect();
    format!("{PREFIX}{safe}")
}

fn leads(app: &AppHandle) -> impl Iterator<Item = (String, WebviewWindow)> {
    app.webview_windows()
        .into_iter()
        .filter(|(name, _)| name.starts_with(PREFIX))
}

fn hide_all_but(app: &AppHandle, keep: Option<&str>) {
    for (name, window) in leads(app) {
        if Some(name.as_str()) != keep {
            let _ = window.hide();
        }
    }
}

/// Puts `window` over the app window's rect `p` (CSS pixels from its top
/// left), in screen coordinates.
fn place(app: &AppHandle, window: &WebviewWindow, p: &Placement) {
    let Some(main) = app.get_webview_window(crate::APP) else {
        return;
    };
    let (Ok(origin), Ok(scale)) = (main.inner_position(), main.scale_factor()) else {
        return;
    };
    let origin = origin.to_logical::<f64>(scale);
    let _ = window.set_position(LogicalPosition::new(origin.x + p.x, origin.y + p.y));
    let _ = window.set_size(LogicalSize::new(p.width.max(1.0), p.height.max(1.0)));
}

/// The app window moved or resized: the lead on show follows it.
pub fn follow(app: &AppHandle) {
    let Some(p) = SHOWN.lock().ok().and_then(|s| s.clone()) else {
        return;
    };
    if let Some(window) = app.get_webview_window(&p.label) {
        place(app, &window, &p);
    }
}

/// Shows the site `id` (`url`, https only) over the given rect of the app
/// window (CSS pixels from the window's top left), making its window on
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
    let placement = Placement {
        label: target.clone(),
        x: x.max(0.0),
        y: y.max(0.0),
        width,
        height,
    };
    if let Ok(mut shown) = SHOWN.lock() {
        *shown = Some(placement.clone());
    }
    let corners = (radius.unwrap_or(0.0), round_left.unwrap_or(false));

    if let Some(window) = app.get_webview_window(&target) {
        place(&app, &window, &placement);
        round(&window, corners);
        let _ = window.show();
        return Ok(());
    }

    let parsed: url::Url = url.parse().map_err(|_| "invalid url".to_string())?;
    if parsed.scheme() != "https" {
        return Err("https only".into());
    }
    let main = app
        .get_webview_window(crate::APP)
        .ok_or_else(|| "no app window".to_string())?;
    let opener = app.clone();
    let window = WebviewWindowBuilder::new(&app, &target, WebviewUrl::External(parsed))
        .parent(&main)
        .map_err(|e| e.to_string())?
        .user_agent(SAFARI_UA)
        .decorations(false)
        .shadow(false)
        .transparent(true)
        .resizable(false)
        .skip_taskbar(true)
        .accept_first_mouse(true)
        .visible(false)
        // Links a site opens in a new window (Gmail's, Dribbble's shots)
        // go to the browser; the site itself stays here.
        .on_new_window(move |link, _| {
            let _ = opener.opener().open_url(link.to_string(), None::<&str>);
            NewWindowResponse::Deny
        })
        .build()
        .map_err(|e| e.to_string())?;
    place(&app, &window, &placement);
    round(&window, corners);
    let _ = window.show();
    Ok(())
}

/// The page sheet's corners on the site's window (a native view ignores
/// the page's CSS): `radius` on the right ones, and the left ones too when
/// the sidebar panel is folded. macOS's continuous curve, the squircle the
/// page's corners use.
#[cfg(target_os = "macos")]
fn round(view: &WebviewWindow, (radius, left): (f64, bool)) {
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
fn round(_view: &WebviewWindow, _corners: (f64, bool)) {}

/// A picture of the site as it is (a JPEG), for the page to show in its
/// place while an overlay (a menu, a tooltip, a dialog) needs the view out
/// of the way: the site looks frozen for a moment instead of gone.
#[tauri::command]
pub async fn lead_snapshot(app: AppHandle, id: String) -> Result<tauri::ipc::Response, String> {
    let view = app
        .get_webview_window(&label(&id))
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

/// Hides every lead (the web app left its /leads page, or an overlay opened
/// over the sheet). They stay loaded.
#[tauri::command]
pub fn lead_hide(app: AppHandle) {
    if let Ok(mut shown) = SHOWN.lock() {
        *shown = None;
    }
    hide_all_but(&app, None);
}

/// Closes one lead's window (its source was removed).
#[tauri::command]
pub fn lead_close(app: AppHandle, id: String) {
    if let Some(window) = app.get_webview_window(&label(&id)) {
        let _ = window.close();
    }
}
