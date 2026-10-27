//! KRTY for Mac: the whole web app in its own window (Dock icon, ⌘Tab),
//! plus a menu bar icon that opens a small popover (the web app's /desktop
//! page) under it: attendance, today's schedule and tasks, notifications.
//!
//! Both windows load the web app. Links to other sites go to the browser,
//! and so does Google sign-in (Google won't run inside an app's webview):
//! the browser signs the app in over krty://auth (see /desktop/connect).

use std::time::Duration;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::NewWindowResponse,
    AppHandle, Manager, RunEvent, Runtime, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
    WindowEvent,
};
use tauri_plugin_autostart::ManagerExt as AutostartExt;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_positioner::{Position, WindowExt};

/// The web app both windows load; a dev build can point at localhost with
/// `KRTY_APP_URL=http://localhost:3000`.
fn app_url() -> &'static str {
    option_env!("KRTY_APP_URL").unwrap_or("https://app.kretyastudio.com")
}

fn app_link(path_and_query: &str) -> url::Url {
    url::Url::parse(app_url())
        .and_then(|base| base.join(path_and_query))
        .expect("app url")
}

const APP: &str = "app";
const POPOVER: &str = "popover";
/// Same as the popover's rounded-3xl.
const RADIUS: f64 = 24.0;

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

/// The web app's "Continue with Google" heads for Supabase's authorize
/// endpoint; inside the app that has to happen in the browser instead.
fn is_google_sign_in(url: &url::Url) -> bool {
    url.path().ends_with("/auth/v1/authorize") || url.host_str() == Some("accounts.google.com")
}

/// Where a link the app won't open itself goes.
fn leave_app<R: Runtime>(app: &AppHandle<R>, url: &url::Url) {
    let target = if is_google_sign_in(url) {
        app_link("/desktop/connect").to_string()
    } else {
        url.to_string()
    };
    let _ = app.opener().open_url(target, None::<&str>);
}

fn show_app(app: &AppHandle, path: Option<&str>) {
    if let Some(w) = app.get_webview_window(APP) {
        if let Some(path) = path {
            let _ = w.navigate(app_link(path));
        }
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
        // Under the menu bar icon; before the icon has been clicked its
        // spot isn't known yet, so the top-right corner instead.
        if w.move_window(Position::TrayBottomCenter).is_err() {
            let _ = w.move_window(Position::TopRight);
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
    if link.scheme() != "krty" || link.host_str() != Some("auth") {
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
    if let Some(w) = app.get_webview_window(APP) {
        let _ = w.navigate(target);
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

/// Runs in every page: makes room for the traffic lights in the web app's
/// top bar, and makes that bar drag the window (double click zooms),
/// except on its buttons and fields.
const SHELL_SCRIPT: &str = r#"
(() => {
  // Room for the traffic lights at the top bar's left end. A style of our
  // own (kept in place if the page's head is rebuilt), not an attribute on
  // <html>, which React resets when it hydrates.
  const css = '[data-slot="app-topbar"]{padding-left:5.25rem!important}';
  const ensure = () => {
    if (document.getElementById("krty-shell-style")) return;
    const style = document.createElement("style");
    style.id = "krty-shell-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  };
  ensure();
  new MutationObserver(ensure).observe(document.documentElement, { childList: true, subtree: true });

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
        if is_app(url) {
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
        let _ = tray.set_title(if title.is_empty() { None } else { Some(title) });
    }
}

#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) {
    let launcher = app.autolaunch();
    let _ = if enabled { launcher.enable() } else { launcher.disable() };
}

#[tauri::command]
fn notify(app: AppHandle, title: String, body: String) {
    let _ = app.notification().builder().title(title).body(body).show();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let shortcut = Shortcut::new(Some(Modifiers::ALT | Modifiers::SUPER), Code::KeyK);

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
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
            notify
        ])
        .setup(move |app| {
            // The app window: the whole web app.
            let main = web_window(app, APP, "/dashboard")
                .title("KRTY")
                // No title bar of its own: the traffic lights sit in the web
                // app's top bar (which leaves room and lets the window be
                // dragged, see SHELL_SCRIPT).
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true)
                .traffic_light_position(tauri::LogicalPosition::new(18.0, 30.0))
                .inner_size(1360.0, 860.0)
                .min_inner_size(960.0, 640.0)
                .center()
                .visible(false)
                .build()?;
            // Closing it keeps KRTY running in the menu bar.
            let keep = main.clone();
            main.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = keep.hide();
                }
            });

            // The popover under the menu bar icon.
            let popover = web_window(app, POPOVER, "/desktop")
                .title("KRTY")
                .inner_size(420.0, 560.0)
                .resizable(false)
                .decorations(false)
                .transparent(true)
                .shadow(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .visible(false)
                .build()?;

            // Native blur behind the popover (the page is 95% solid on top).
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                let _ = apply_vibrancy(
                    &popover,
                    NSVisualEffectMaterial::HudWindow,
                    Some(NSVisualEffectState::Active),
                    Some(RADIUS),
                );
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
            let open = MenuItem::with_id(app, "open", "Buka KRTY", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Keluar dari KRTY", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::with_id("main")
                .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png"))?)
                .icon_as_template(true)
                .tooltip("KRTY")
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

            app.global_shortcut().register(shortcut)?;

            // Sign-in coming back from the browser.
            let links = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for link in event.urls() {
                    handle_deep_link(&links, &link);
                }
            });

            // Opened by hand: show the app window (not when it starts with
            // the Mac, which passes --hidden: then it waits in the menu bar).
            if !std::env::args().any(|a| a == "--hidden") {
                show_app(app.handle(), None);
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building KRTY");

    app.run(|app, event| {
        // Clicking the Dock icon brings the app window back.
        if let RunEvent::Reopen { .. } = event {
            show_app(app, None);
        }
    });
}
