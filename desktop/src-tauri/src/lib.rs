//! Kretya Flow (KRTY for Mac): the whole web app in its own window (Dock icon, ⌘Tab),
//! plus a menu bar icon that opens a small popover (the web app's /desktop
//! page) under it: attendance, today's schedule and tasks, notifications.
//!
//! Both windows load the web app. Links to other sites go to the browser,
//! and so does Google sign-in (Google won't run inside an app's webview):
//! the browser signs the app in over krty://auth (see /desktop/connect).

mod leads;
mod updater;

use std::time::Duration;

#[cfg(target_os = "macos")]
use tauri::{
    menu::{MenuEvent, MenuItemKind},
    RunEvent,
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::NewWindowResponse,
    AppHandle, Manager, Runtime, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_autostart::ManagerExt as AutostartExt;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
#[cfg(not(target_os = "macos"))]
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_positioner::{Position, WindowExt};

/// The web app both windows load; a dev build can point at localhost with
/// `KRTY_APP_URL=http://localhost:3000`.
fn app_url() -> &'static str {
    option_env!("KRTY_APP_URL").unwrap_or("https://app.kretyastudio.com")
}

/// The deep link scheme: krty, or another one for a local dev build
/// (`KRTY_SCHEME=krtydev`, with its own identifier) so the installed app
/// doesn't take its sign-in.
fn scheme() -> &'static str {
    option_env!("KRTY_SCHEME").unwrap_or("krty")
}

fn app_link(path_and_query: &str) -> url::Url {
    url::Url::parse(app_url())
        .and_then(|base| base.join(path_and_query))
        .expect("app url")
}

const APP: &str = "app";
const POPOVER: &str = "popover";
/// Same as the popover's rounded-3xl.
#[cfg(target_os = "macos")]
const RADIUS: f64 = 24.0;
/// The popover panel (420×560) sits in a slightly larger window, with room
/// for its shadow: 20pt at the sides and bottom, 6pt on top.
const PANEL: (f64, f64) = (420.0, 560.0);
const MARGIN: f64 = 20.0;
const MARGIN_TOP: f64 = 6.0;

/// Is this URL the web app itself (stays in the window) or somewhere else
/// (goes to the browser)?
fn is_app(url: &url::Url) -> bool {
    match url.scheme() {
        "tauri" | "asset" | "about" | "data" | "blob" => true,
        "http" | "https" => {
            url.host_str() == Some("tauri.localhost")
                || url::Url::parse(app_url()).map_or(false, |a| a.origin() == url.origin())
        }
        _ => false,
    }
}

/// Players and previews the editor embeds in an iframe (Figma, Drive,
/// YouTube, Vimeo, Loom; src/shared/lib/embeds.ts). WKWebView asks the
/// navigation handler about every frame, not just the window, so without
/// this an embed loading inside a report was sent to the browser (and
/// blocked in the app). The web app opens links to these sites in a new
/// window, which on_new_window still hands to the browser.
fn is_embed(url: &url::Url) -> bool {
    const HOSTS: &[&str] = &[
        "figma.com",
        "drive.google.com",
        "docs.google.com",
        // A private Drive file's embed shows Google's sign-in in the frame.
        // (The app's own Google sign-in is caught earlier, at Supabase's
        // authorize step, so it still goes to the browser.)
        "accounts.google.com",
        "youtube-nocookie.com",
        "youtube.com",
        "vimeo.com",
        "loom.com",
    ];
    matches!(url.scheme(), "http" | "https")
        && url.host_str().is_some_and(|host| {
            HOSTS
                .iter()
                .any(|h| host == *h || host.ends_with(&format!(".{h}")))
        })
}

/// The web app's "Continue with Google" heads for Supabase's authorize
/// endpoint; inside the app that has to happen in the browser instead.
fn is_google_sign_in(url: &url::Url) -> bool {
    url.path().ends_with("/auth/v1/authorize") || url.host_str() == Some("accounts.google.com")
}

/// Where a link the app won't open itself goes.
fn leave_app<R: Runtime>(app: &AppHandle<R>, url: &url::Url) {
    let target = if is_google_sign_in(url) {
        if scheme() == "krty" {
            app_link("/desktop/connect").to_string()
        } else {
            app_link(&format!("/desktop/connect?scheme={}", scheme())).to_string()
        }
    } else {
        url.to_string()
    };
    let _ = app.opener().open_url(target, None::<&str>);
}

fn show_app(app: &AppHandle, path: Option<&str>) {
    // The window and its page apart: once Leads adds its web views the app
    // window is no longer a "webview window" (get_webview_window is None).
    if let Some(path) = path {
        if let Some(page) = app.get_webview(APP) {
            let _ = page.navigate(app_link(path));
        }
    }
    if let Some(w) = app.get_window(APP) {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
    if let Some(p) = app.get_webview_window(POPOVER) {
        let _ = p.hide();
    }
}

fn show_popover(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(POPOVER) {
        // Under the menu bar icon (on Windows above the tray icon, kept on
        // screen); before the icon has been clicked its spot isn't known
        // yet, so the corner by the menu bar / taskbar instead.
        #[cfg(target_os = "macos")]
        let (by_tray, corner) = (
            w.move_window(Position::TrayBottomCenter),
            Position::TopRight,
        );
        #[cfg(not(target_os = "macos"))]
        let (by_tray, corner) = (
            w.move_window_constrained(Position::TrayCenter),
            Position::BottomRight,
        );
        if by_tray.is_err() {
            let _ = w.move_window(corner);
        }
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn toggle_popover(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(POPOVER) {
        if w.is_visible().unwrap_or(false) {
            let _ = w.hide();
        } else {
            show_popover(app);
        }
    }
}

/// krty://auth?token=… : finish signing in (both windows share cookies).
fn handle_deep_link(app: &AppHandle, link: &url::Url) {
    if link.scheme() != scheme() || link.host_str() != Some("auth") {
        return;
    }
    let Some(token) = link
        .query_pairs()
        .find(|(k, _)| k == "token")
        .map(|(_, v)| v.into_owned())
    else {
        return;
    };
    let mut target = app_link("/auth/desktop");
    target
        .query_pairs_mut()
        .append_pair("token", &token)
        .append_pair("next", "/dashboard");
    if let Some(page) = app.get_webview(APP) {
        let _ = page.navigate(target);
    }
    show_app(app, None);
    // The popover picks the new session up once the app window has it.
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(4));
        if let Some(p) = handle.get_webview_window(POPOVER) {
            let _ = p.navigate(app_link("/desktop"));
        }
    });
}

/// Runs in every page: makes the web app's top bar drag the window (double
/// click zooms), except on its buttons and fields. (The web app lays itself
/// out for the window by a cookie, set when the loader opens it through
/// /auth/desktop-shell.)
const SHELL_SCRIPT: &str = r#"
(() => {
  addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const bar = e.target.closest?.('[data-slot="app-topbar"]');
    if (!bar || e.target.closest('a, button, input, textarea, select, [role="button"], [role="radio"], [role="tab"], [contenteditable]')) return;
    const win = window.__TAURI__?.window?.getCurrentWindow?.();
    if (!win) return;
    if (e.detail === 2) win.toggleMaximize(); else win.startDragging();
  });
})();
"#;

/// A window loading the web app, through the local loader page (which
/// shows a "can't reach KRTY" screen when the VPN is off).
fn web_window<'a>(
    app: &'a tauri::App,
    label: &str,
    path: &str,
) -> WebviewWindowBuilder<'a, tauri::Wry, tauri::App> {
    let nav = app.handle().clone();
    let popup = app.handle().clone();
    WebviewWindowBuilder::new(
        app,
        label,
        WebviewUrl::App(format!("index.html?to={path}").into()),
    )
    .initialization_script(format!("window.__KRTY_APP_URL__ = {:?};", app_url()))
    .initialization_script(SHELL_SCRIPT)
    .on_navigation(move |url| {
        if is_app(url) || is_embed(url) {
            return true;
        }
        leave_app(&nav, url);
        false
    })
    // target="_blank" links: the web app's own pages open in the app
    // window, anything else in the browser.
    .on_new_window(move |url, _| {
        if is_app(&url) {
            show_app(&popup, Some(&url[url::Position::BeforePath..]));
        } else {
            leave_app(&popup, &url);
        }
        NewWindowResponse::Deny
    })
}

/// An empty compact unified toolbar: macOS then draws the traffic lights at
/// their toolbar size and lays them out itself (without one, the larger
/// lights were clipped to the plain title bar's narrower buttons).
#[cfg(target_os = "macos")]
fn unified_toolbar(window: &WebviewWindow) {
    use objc2::{MainThreadMarker, MainThreadOnly};
    use objc2_app_kit::{NSToolbar, NSWindow, NSWindowToolbarStyle};
    let (Ok(ptr), Some(mtm)) = (window.ns_window(), MainThreadMarker::new()) else {
        return;
    };
    // SAFETY: Tauri hands out the window's NSWindow, on the main thread.
    let ns_window = unsafe { &*(ptr as *const NSWindow) };
    let toolbar = NSToolbar::init(NSToolbar::alloc(mtm));
    ns_window.setToolbar(Some(&toolbar));
    ns_window.setToolbarStyle(NSWindowToolbarStyle::UnifiedCompact);
}

/// The blur fills the whole window by default; keep it to the panel, so the
/// shadow margin around it stays clear.
#[cfg(target_os = "macos")]
fn fit_blur_to_panel(window: &WebviewWindow) {
    use objc2::ClassType;
    use objc2_app_kit::{NSAutoresizingMaskOptions, NSVisualEffectView, NSWindow};
    use objc2_foundation::{NSObjectProtocol, NSPoint, NSRect, NSSize};
    let Ok(ptr) = window.ns_window() else { return };
    // SAFETY: Tauri hands out the window's NSWindow, on the main thread.
    let ns_window = unsafe { &*(ptr as *const NSWindow) };
    let Some(content) = ns_window.contentView() else {
        return;
    };
    for view in content.subviews().iter() {
        if view.isKindOfClass(NSVisualEffectView::class()) {
            // AppKit's origin is the bottom-left corner.
            view.setAutoresizingMask(NSAutoresizingMaskOptions::empty());
            view.setFrame(NSRect::new(
                NSPoint::new(MARGIN, MARGIN),
                NSSize::new(PANEL.0, PANEL.1),
            ));
        }
    }
}

/// The Edit menu's Undo / Redo. macOS's own items send `undo:` to the
/// focused view, which only reaches text undo in a field; these ask the
/// page instead: the web app's undo (shared/undo, ⌘Z when not typing)
/// when nothing editable has focus, else the native text undo / redo
/// (back through `native_edit`). The page usually gets ⌘Z itself first
/// (WKWebView hands key equivalents to the page before the menu), and
/// then the menu never fires.
#[cfg(target_os = "macos")]
const MENU_UNDO: &str = "krty-undo";
#[cfg(target_os = "macos")]
const MENU_REDO: &str = "krty-redo";

/// macOS only: Windows has no app menu bar (a menu there would sit inside
/// every window); ctrl+Z goes straight to the page.
#[cfg(target_os = "macos")]
fn app_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let menu = Menu::default(app)?;
    for item in menu.items()? {
        let MenuItemKind::Submenu(edit) = item else {
            continue;
        };
        if edit.text()? != "Edit" {
            continue;
        }
        // Undo and Redo are its first two items.
        edit.remove_at(0)?;
        edit.remove_at(0)?;
        let undo = MenuItem::with_id(app, MENU_UNDO, "Undo", true, Some("CmdOrCtrl+Z"))?;
        let redo = MenuItem::with_id(app, MENU_REDO, "Redo", true, Some("CmdOrCtrl+Shift+Z"))?;
        edit.insert(&undo, 0)?;
        edit.insert(&redo, 1)?;
    }
    Ok(menu)
}

#[cfg(target_os = "macos")]
fn on_app_menu(app: &AppHandle, event: MenuEvent) {
    let action = match event.id().as_ref() {
        MENU_UNDO => "undo",
        MENU_REDO => "redo",
        _ => return,
    };
    // The window in front (the popover when it's open), else the app's.
    let window = [APP, POPOVER]
        .iter()
        .filter_map(|label| app.get_webview(label))
        .find(|w| w.window().is_focused().unwrap_or(false))
        .or_else(|| app.get_webview(APP));
    if let Some(w) = window {
        // A page without the web app's undo (the loader, signed out, an
        // older web build) still gets text undo.
        let _ = w.eval(format!(
            "(() => {{ const a = {action:?}; if (window.__krtyMenuEdit) window.__krtyMenuEdit(a); \
             else window.__TAURI__?.core?.invoke(\"native_edit\", {{ action: a }}); }})()"
        ));
    }
}

/// Native text undo / redo in the focused field (what macOS's own Edit
/// menu items do): `undo:` / `redo:` down the responder chain.
#[tauri::command]
fn native_edit(app: AppHandle, action: String) -> bool {
    #[cfg(target_os = "macos")]
    {
        let _ = app.run_on_main_thread(move || {
            use objc2::{sel, MainThreadMarker};
            use objc2_app_kit::NSApplication;
            let Some(mtm) = MainThreadMarker::new() else {
                return;
            };
            let ns_app = NSApplication::sharedApplication(mtm);
            let selector = if action == "redo" {
                sel!(redo:)
            } else {
                sel!(undo:)
            };
            // SAFETY: a standard action, sent to the first responder.
            unsafe { ns_app.sendAction_to_from(selector, None, None) };
        });
        true
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, action);
        false
    }
}

// Commands the web app calls through window.__TAURI__.

#[tauri::command]
fn open_external(app: AppHandle, url: String) {
    if let Ok(url) = url::Url::parse(&url) {
        leave_app(&app, &url);
    }
}

#[tauri::command]
fn open_in_app(app: AppHandle, path: String) {
    show_app(&app, Some(&path));
}

#[tauri::command]
fn set_tray_title(app: AppHandle, title: String) {
    if let Some(tray) = app.tray_by_id("main") {
        // Windows' tray has no text beside the icon: its tooltip instead.
        #[cfg(not(target_os = "macos"))]
        let _ = tray.set_tooltip(Some(if title.is_empty() {
            "Kretya Flow".to_string()
        } else {
            format!("Kretya Flow · {title}")
        }));
        #[cfg(target_os = "macos")]
        let _ = tray.set_title(if title.is_empty() { None } else { Some(title) });
    }
}

/// Turns opening at login on or off; returns what it is now.
#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> bool {
    let launcher = app.autolaunch();
    let _ = if enabled {
        launcher.enable()
    } else {
        launcher.disable()
    };
    launcher.is_enabled().unwrap_or(false)
}

/// Whether the app opens at login (its LaunchAgent is in place).
#[tauri::command]
fn get_autostart(app: AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

/// The app's own name, version (tauri.conf.json) and bundle id, for the
/// web app's "Setelan app" page and its update check.
#[derive(serde::Serialize)]
struct AppInfo {
    name: String,
    version: String,
    identifier: String,
}

#[tauri::command]
fn app_info(app: AppHandle) -> AppInfo {
    let config = app.config();
    AppInfo {
        name: app.package_info().name.clone(),
        version: app.package_info().version.to_string(),
        identifier: config.identifier.clone(),
    }
}

/// macOS System Settings, straight at this app's notification settings
/// ("notifications") or at Login Items ("login-items"). Falls back to the
/// pane itself when the deep link doesn't open.
#[tauri::command]
fn open_system_settings(app: AppHandle, pane: String) {
    #[cfg(not(target_os = "macos"))]
    {
        // Windows: Settings → Notifications, or → Apps → Startup.
        let target = match pane.as_str() {
            "login-items" => "ms-settings:startupapps",
            _ => "ms-settings:notifications",
        };
        let _ = app.opener().open_url(target, None::<&str>);
        return;
    }
    #[allow(unreachable_code)]
    let identifier = app.config().identifier.clone();
    let (deep, fallback) = match pane.as_str() {
        "login-items" => (
            "x-apple.systempreferences:com.apple.LoginItems-Settings.extension".to_string(),
            "x-apple.systempreferences:com.apple.preference.users?startupItemsPref".to_string(),
        ),
        _ => (
            format!(
                "x-apple.systempreferences:com.apple.Notifications-Settings.extension?id={identifier}"
            ),
            "x-apple.systempreferences:com.apple.preference.notifications".to_string(),
        ),
    };
    if app.opener().open_url(deep, None::<&str>).is_err() {
        let _ = app.opener().open_url(fallback, None::<&str>);
    }
}

/// What macOS allows this app to show: "granted", "denied" or
/// "notDetermined", plus the details the settings page points at.
#[derive(serde::Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct NotificationStatus {
    status: String,
    /// "banner", "alert" or "none".
    alert_style: String,
    badges: bool,
    sounds: bool,
}

#[tauri::command]
async fn notification_status() -> NotificationStatus {
    #[cfg(target_os = "macos")]
    return mac_notify::status();
    #[cfg(not(target_os = "macos"))]
    NotificationStatus {
        status: "granted".into(),
        alert_style: "banner".into(),
        badges: true,
        sounds: true,
    }
}

/// Asks macOS for permission (its prompt shows only while undecided), then
/// reports the status.
#[tauri::command]
async fn request_notification_permission() -> NotificationStatus {
    #[cfg(target_os = "macos")]
    {
        mac_notify::request();
        return mac_notify::status();
    }
    #[cfg(not(target_os = "macos"))]
    notification_status().await
}

/// Light or dark for the windows (their native blur follows it), as the
/// web app's theme: "light", "dark" or "system".
#[tauri::command]
fn set_theme(app: AppHandle, theme: String) {
    let theme = match theme.as_str() {
        "light" => Some(tauri::Theme::Light),
        "dark" => Some(tauri::Theme::Dark),
        _ => None,
    };
    // The window, not the "webview window" (gone once Leads adds views).
    if let Some(w) = app.get_window(APP) {
        let _ = w.set_theme(theme);
    }
}

/// A macOS notification; clicking it opens the app window, at `path` (a
/// page of the web app) when given.
#[tauri::command]
fn notify(
    app: AppHandle,
    title: String,
    body: String,
    path: Option<String>,
    sound: Option<String>,
) {
    #[cfg(target_os = "macos")]
    {
        let _ = app;
        mac_notify::show(&title, &body, path.as_deref(), sound.as_deref());
    }
    #[cfg(not(target_os = "macos"))]
    {
        // Windows: the page plays the Kretya sounds itself (see the web
        // app's notification-sound.ts), so the toast stays silent unless
        // Windows' own sound was picked. A name Windows doesn't know means
        // a silent toast. (A click on it only brings the app forward.)
        let _ = path;
        let sound = match sound.as_deref() {
            None | Some("default") | Some("") => "Default",
            _ => "Silent",
        };
        let _ = app
            .notification()
            .builder()
            .title(title)
            .body(body)
            .sound(sound)
            .show();
    }
}

/// macOS notifications through UserNotifications (the older API the
/// notification plugin uses no longer shows anything on current macOS).
#[cfg(target_os = "macos")]
mod mac_notify {
    use block2::{DynBlock, RcBlock};
    use objc2::rc::Retained;
    use objc2::runtime::{Bool, NSObject, ProtocolObject};
    use objc2::{define_class, msg_send, AllocAnyThread};
    use objc2_foundation::{NSError, NSObjectProtocol, NSString};
    use objc2_user_notifications::{
        UNAlertStyle, UNAuthorizationOptions, UNAuthorizationStatus, UNMutableNotificationContent,
        UNNotification, UNNotificationPresentationOptions, UNNotificationRequest,
        UNNotificationResponse, UNNotificationSetting, UNNotificationSettings, UNNotificationSound,
        UNUserNotificationCenter, UNUserNotificationCenterDelegate,
    };
    use std::ptr::NonNull;

    define_class!(
        // Shows banners while KRTY is in front too (macOS hides them by
        // default then), and opens the app window when one is clicked.
        #[unsafe(super(NSObject))]
        #[name = "KrtyNotificationDelegate"]
        struct Delegate;

        unsafe impl NSObjectProtocol for Delegate {}

        unsafe impl UNUserNotificationCenterDelegate for Delegate {
            #[unsafe(method(userNotificationCenter:willPresentNotification:withCompletionHandler:))]
            fn will_present(
                &self,
                _center: &UNUserNotificationCenter,
                _notification: &UNNotification,
                handler: &DynBlock<dyn Fn(UNNotificationPresentationOptions)>,
            ) {
                handler.call((UNNotificationPresentationOptions::Banner
                    | UNNotificationPresentationOptions::List
                    | UNNotificationPresentationOptions::Sound,));
            }

            #[unsafe(method(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:))]
            fn did_receive(
                &self,
                _center: &UNUserNotificationCenter,
                response: &UNNotificationResponse,
                handler: &DynBlock<dyn Fn()>,
            ) {
                // The page to open rides along in the request's id
                // ("krty-<n>#/settings/app?download=1").
                let id = response.notification().request().identifier().to_string();
                let path = id.split_once('#').map(|(_, p)| p.to_string());
                if let Some(app) = APP_HANDLE.get() {
                    super::show_app(app, path.as_deref().filter(|p| p.starts_with('/')));
                }
                handler.call(());
            }
        }
    );

    static APP_HANDLE: std::sync::OnceLock<tauri::AppHandle> = std::sync::OnceLock::new();

    /// Ask once for permission (macOS shows its prompt the first time), and
    /// set up the delegate.
    pub fn setup(app: &tauri::AppHandle) {
        let _ = APP_HANDLE.set(app.clone());
        let center = UNUserNotificationCenter::currentNotificationCenter();
        let delegate: Retained<Delegate> = unsafe { msg_send![Delegate::alloc(), init] };
        center.setDelegate(Some(ProtocolObject::from_ref(&*delegate)));
        // The center only holds it weakly; it lives as long as the app.
        std::mem::forget(delegate);
        let done = RcBlock::new(|_granted: Bool, _error: *mut NSError| {});
        center.requestAuthorizationWithOptions_completionHandler(
            UNAuthorizationOptions::Alert
                | UNAuthorizationOptions::Sound
                | UNAuthorizationOptions::Badge,
            &done,
        );
    }

    /// Ask for permission and wait for the answer (macOS only prompts
    /// while it's undecided; otherwise it answers right away).
    pub fn request() {
        let (tx, rx) = std::sync::mpsc::channel::<()>();
        let done = RcBlock::new(move |_granted: Bool, _error: *mut NSError| {
            let _ = tx.send(());
        });
        UNUserNotificationCenter::currentNotificationCenter()
            .requestAuthorizationWithOptions_completionHandler(
                UNAuthorizationOptions::Alert
                    | UNAuthorizationOptions::Sound
                    | UNAuthorizationOptions::Badge,
                &done,
            );
        // Long enough for someone to answer the prompt.
        let _ = rx.recv_timeout(std::time::Duration::from_secs(120));
    }

    pub fn status() -> super::NotificationStatus {
        let (tx, rx) = std::sync::mpsc::channel::<super::NotificationStatus>();
        let done = RcBlock::new(move |settings: NonNull<UNNotificationSettings>| {
            // SAFETY: UserNotifications hands a valid settings object.
            let s = unsafe { settings.as_ref() };
            let status = match s.authorizationStatus() {
                UNAuthorizationStatus::Denied => "denied",
                UNAuthorizationStatus::NotDetermined => "notDetermined",
                _ => "granted",
            };
            let alert_style = match s.alertStyle() {
                UNAlertStyle::Alert => "alert",
                UNAlertStyle::Banner => "banner",
                _ => "none",
            };
            let _ = tx.send(super::NotificationStatus {
                status: status.into(),
                alert_style: alert_style.into(),
                badges: s.badgeSetting() == UNNotificationSetting::Enabled,
                sounds: s.soundSetting() == UNNotificationSetting::Enabled,
            });
        });
        UNUserNotificationCenter::currentNotificationCenter()
            .getNotificationSettingsWithCompletionHandler(&done);
        rx.recv_timeout(std::time::Duration::from_secs(5))
            .unwrap_or_else(|_| super::NotificationStatus {
                status: "unknown".into(),
                ..Default::default()
            })
    }

    /// `sound`: "none", "default" (macOS's), or a file bundled in the app's
    /// Resources ("kretya.aiff", picked in Settings → Notifikasi).
    pub fn show(title: &str, body: &str, path: Option<&str>, sound: Option<&str>) {
        let center = UNUserNotificationCenter::currentNotificationCenter();
        let content = UNMutableNotificationContent::new();
        content.setTitle(&NSString::from_str(title));
        content.setBody(&NSString::from_str(body));
        match sound {
            Some("none") => {}
            None | Some("default") | Some("") => {
                content.setSound(Some(&UNNotificationSound::defaultSound()))
            }
            Some(name) => content.setSound(Some(&UNNotificationSound::soundNamed(
                &NSString::from_str(name),
            ))),
        }
        let id = NSString::from_str(&format!(
            "krty-{}{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_or(0, |d| d.as_nanos()),
            path.map(|p| format!("#{p}")).unwrap_or_default()
        ));
        let request =
            UNNotificationRequest::requestWithIdentifier_content_trigger(&id, &content, None);
        center.addNotificationRequest_withCompletionHandler(&request, None);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ⌥⌘K on the Mac, Ctrl+Alt+K on Windows (Win-key combos belong to it).
    #[cfg(target_os = "macos")]
    let shortcut = Shortcut::new(Some(Modifiers::ALT | Modifiers::SUPER), Code::KeyK);
    #[cfg(not(target_os = "macos"))]
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyK);

    let builder = tauri::Builder::default();
    // Windows: opening it again (or a krty:// link, which starts a second
    // copy there) goes to the one already running. Must come first.
    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        show_app(app, None);
    }));
    let builder = builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, sc, event| {
                    if sc == &shortcut && event.state() == ShortcutState::Pressed {
                        toggle_popover(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            open_external,
            open_in_app,
            set_tray_title,
            set_autostart,
            get_autostart,
            set_theme,
            notify,
            app_info,
            open_system_settings,
            notification_status,
            request_notification_permission,
            native_edit,
            updater::update_status,
            updater::update_check,
            updater::update_install,
            leads::lead_show,
            leads::lead_hide,
            leads::lead_close,
            leads::lead_snapshot
        ]);
    #[cfg(target_os = "macos")]
    let builder = builder.menu(app_menu).on_menu_event(on_app_menu);
    let app = builder
        .setup(move |app| {
            // The app window: the whole web app.
            let main = web_window(app, APP, "/dashboard")
                .title("Kretya Flow")
                .inner_size(1360.0, 860.0)
                .min_inner_size(960.0, 640.0)
                .center()
                .visible(false);
            // No title bar of its own: the page runs up to the top and the
            // traffic lights sit in the web app's top bar (see
            // unified_toolbar and SHELL_SCRIPT); see-through, over the
            // native sidebar blur (the page itself stays solid). Windows
            // keeps its own title bar, and the web app its web layout.
            #[cfg(target_os = "macos")]
            let main = main
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true)
                .transparent(true);
            let main = main.build()?;
            #[cfg(target_os = "macos")]
            {
                unified_toolbar(&main);
                use window_vibrancy::{
                    apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
                };
                // The most see-through material (it follows light / dark),
                // kept live when the window isn't focused: the inactive
                // state turns it a flat grey.
                let _ = apply_vibrancy(
                    &main,
                    NSVisualEffectMaterial::UnderWindowBackground,
                    Some(NSVisualEffectState::Active),
                    None,
                );
            }
            // The page fills the window, sized by AppKit (see fit_page).
            leads::fit_page(app.handle());
            // Closing it keeps KRTY running in the menu bar.
            let keep = main.clone();
            let page = app.handle().clone();
            main.on_window_event(move |event| match event {
                WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    let _ = keep.hide();
                    // The Leads site goes with it (shown again by its page).
                    leads::lead_hide(page.clone());
                }
                // The window no longer sizes its own page (child web views
                // on): keep the page the whole window.
                WindowEvent::Resized(_)
                | WindowEvent::ScaleFactorChanged { .. }
                | WindowEvent::Focused(true) => {
                    leads::fit_page(&page);
                    leads::settle_page(&page);
                }
                _ => {}
            });

            // The popover under the menu bar icon.
            // It keeps running while hidden: it's what watches for new
            // notifications and reminders.
            let popover = web_window(app, POPOVER, "/desktop")
                .background_throttling(tauri::utils::config::BackgroundThrottlingPolicy::Disabled)
                .title("Kretya Flow")
                .inner_size(PANEL.0 + 2.0 * MARGIN, PANEL.1 + MARGIN + MARGIN_TOP)
                .resizable(false)
                .decorations(false)
                .transparent(true)
                // No native shadow: on a transparent window it's a square
                // edge around the rounded popover.
                .shadow(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .visible(false)
                .build()?;

            // Native blur behind the popover (the page is 95% solid on top).
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{
                    apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
                };
                let _ = apply_vibrancy(
                    &popover,
                    NSVisualEffectMaterial::HudWindow,
                    Some(NSVisualEffectState::Active),
                    Some(RADIUS),
                );
                fit_blur_to_panel(&popover);
            }

            // Click away: the popover closes, like a menu. (Only once it
            // has had focus: showing it fires a blur first.)
            let hide_on_blur: WebviewWindow = popover.clone();
            let had_focus = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
            popover.on_window_event(move |event| {
                use std::sync::atomic::Ordering;
                match event {
                    WindowEvent::Focused(true) => had_focus.store(true, Ordering::Relaxed),
                    WindowEvent::Focused(false) if had_focus.swap(false, Ordering::Relaxed) => {
                        let _ = hide_on_blur.hide();
                    }
                    _ => {}
                }
            });

            // Menu bar icon: left click opens the popover, right click has
            // the app window and Quit.
            let open = MenuItem::with_id(app, "open", "Buka Kretya Flow", true, None::<&str>)?;
            let quit =
                MenuItem::with_id(app, "quit", "Keluar dari Kretya Flow", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            // The Mac's menu bar takes a template (it tints it); Windows'
            // tray shows the colored app icon.
            #[cfg(target_os = "macos")]
            let tray_icon = include_bytes!("../icons/tray.png");
            #[cfg(not(target_os = "macos"))]
            let tray_icon = include_bytes!("../icons/32x32.png");
            TrayIconBuilder::with_id("main")
                .icon(tauri::image::Image::from_bytes(tray_icon)?)
                .icon_as_template(cfg!(target_os = "macos"))
                .tooltip("Kretya Flow")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => show_app(app, None),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_popover(tray.app_handle());
                    }
                })
                .build(app)?;

            // Taken already (another app, or the installed app beside a dev
            // build): the app still starts, without the shortcut.
            let _ = app.global_shortcut().register(shortcut);

            // Sign-in coming back from the browser.
            let links = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for link in event.urls() {
                    handle_deep_link(&links, &link);
                }
            });

            #[cfg(target_os = "macos")]
            mac_notify::setup(app.handle());

            // In-place updates: checked now and every 6 hours.
            updater::setup(app.handle());

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Kretya Flow");

    app.run(|_app, _event| {
        // Clicking the Dock icon brings the app window back.
        #[cfg(target_os = "macos")]
        if let RunEvent::Reopen { .. } = _event {
            show_app(_app, None);
        }
    });
}
