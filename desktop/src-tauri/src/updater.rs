//! In-place updates (tauri-plugin-updater): checked at launch and every 6
//! hours against the web app's /api/desktop/update (tauri.conf.json →
//! plugins.updater), downloaded in the background and kept in memory until
//! someone clicks "Restart" in the web app (the sidebar card or Setelan
//! app), which installs it over this .app and relaunches.
//!
//! The web app reads the state with `update_status`, hears changes on the
//! "update-status" event, checks by hand with `update_check` and installs
//! with `update_install`. The native "ready" notification is the web app's
//! (the popover sends it once per version, in the user's language).

use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::{Error, Update, UpdaterExt};

const EVERY: Duration = Duration::from_secs(6 * 60 * 60);
const EVENT: &str = "update-status";

/// What the web app shows. `phase`: "idle" (not checked yet), "checking",
/// "downloading", "ready" (downloaded, waiting for a restart),
/// "upToDate" or "error".
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    phase: &'static str,
    /// The running version.
    current: String,
    /// The update's version (downloading / ready).
    version: Option<String>,
    notes: Option<String>,
    downloaded: u64,
    total: Option<u64>,
    /// Unix ms of the last finished check.
    last_checked: Option<u64>,
    /// "network", "signature", "install" or "other" (the web app words it).
    error_kind: Option<&'static str>,
    /// The raw error, for a tooltip / bug report.
    error: Option<String>,
}

struct Inner {
    status: Status,
    /// The downloaded, signature-checked update.
    ready: Option<(Update, Vec<u8>)>,
    busy: bool,
}

pub struct Updates(Mutex<Inner>);

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

fn kind(e: &Error) -> &'static str {
    match e {
        Error::Reqwest(_) | Error::Network(_) | Error::Http(_) => "network",
        Error::Minisign(_) | Error::SignatureUtf8(_) | Error::Base64(_) => "signature",
        _ => "other",
    }
}

fn emit(app: &AppHandle, status: &Status) {
    let _ = app.emit(EVENT, status.clone());
}

/// Change the status (under the lock), then tell the pages.
fn set(app: &AppHandle, f: impl FnOnce(&mut Inner)) -> Status {
    let state = app.state::<Updates>();
    let status = {
        let mut inner = state.0.lock().unwrap();
        f(&mut inner);
        inner.status.clone()
    };
    emit(app, &status);
    status
}

/// Registers the state and starts the launch + 6-hourly checks.
pub fn setup(app: &AppHandle) {
    app.manage(Updates(Mutex::new(Inner {
        status: Status {
            phase: "idle",
            current: app.package_info().version.to_string(),
            version: None,
            notes: None,
            downloaded: 0,
            total: None,
            last_checked: None,
            error_kind: None,
            error: None,
        },
        ready: None,
        busy: false,
    })));
    let app = app.clone();
    // A minute tick against the wall clock (a sleeping Mac doesn't move a
    // plain 6-hour sleep forward).
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(5));
        let mut last = None::<SystemTime>;
        loop {
            let due = last.map_or(true, |t| t.elapsed().map_or(true, |e| e >= EVERY));
            if due {
                last = Some(SystemTime::now());
                if begin(&app) {
                    tauri::async_runtime::block_on(run(&app));
                }
            }
            std::thread::sleep(Duration::from_secs(60));
        }
    });
}

/// Marks a check as started ("checking"); false when one (or a download)
/// is already going.
fn begin(app: &AppHandle) -> bool {
    {
        let state = app.state::<Updates>();
        let mut inner = state.0.lock().unwrap();
        if inner.busy {
            return false;
        }
        inner.busy = true;
    }
    set(app, |i| {
        // A downloaded update stays "ready" while checking again.
        if i.status.phase != "ready" {
            i.status.phase = "checking";
        }
    });
    true
}

/// Check, and download a newer version (after `begin`).
async fn run(app: &AppHandle) -> Status {
    let found = match app.updater() {
        Ok(updater) => updater.check().await,
        Err(e) => Err(e),
    };
    let update = match found {
        Err(e) => {
            return set(app, |i| {
                i.busy = false;
                i.status.last_checked = Some(now_ms());
                if i.ready.is_none() {
                    i.status.phase = "error";
                    i.status.error_kind = Some(kind(&e));
                    i.status.error = Some(e.to_string());
                }
            })
        }
        Ok(None) => {
            return set(app, |i| {
                i.busy = false;
                i.ready = None;
                i.status.phase = "upToDate";
                i.status.version = None;
                i.status.notes = None;
                i.status.last_checked = Some(now_ms());
                i.status.error_kind = None;
                i.status.error = None;
            })
        }
        Ok(Some(update)) => update,
    };

    // Already downloaded this one.
    let have = {
        let state = app.state::<Updates>();
        let inner = state.0.lock().unwrap();
        inner.ready.as_ref().map(|(u, _)| u.version.clone())
    };
    if have.as_deref() == Some(update.version.as_str()) {
        return set(app, |i| {
            i.busy = false;
            i.status.phase = "ready";
            i.status.last_checked = Some(now_ms());
        });
    }

    set(app, |i| {
        i.ready = None;
        i.status.phase = "downloading";
        i.status.version = Some(update.version.clone());
        i.status.notes = update.body.clone();
        i.status.downloaded = 0;
        i.status.total = None;
        i.status.last_checked = Some(now_ms());
        i.status.error_kind = None;
        i.status.error = None;
    });

    let progress = app.clone();
    let mut downloaded: u64 = 0;
    let mut last_emit = std::time::Instant::now();
    let bytes = update
        .download(
            move |chunk, total| {
                downloaded += chunk as u64;
                // A few updates a second is plenty for a progress bar.
                if last_emit.elapsed() >= Duration::from_millis(250) {
                    last_emit = std::time::Instant::now();
                    let d = downloaded;
                    set(&progress, |i| {
                        i.status.downloaded = d;
                        i.status.total = total;
                    });
                }
            },
            || {},
        )
        .await;

    match bytes {
        Ok(bytes) => set(app, |i| {
            i.busy = false;
            i.status.phase = "ready";
            i.status.downloaded = bytes.len() as u64;
            i.status.total = Some(bytes.len() as u64);
            i.ready = Some((update, bytes));
        }),
        Err(e) => set(app, |i| {
            i.busy = false;
            i.status.phase = "error";
            i.status.error_kind = Some(kind(&e));
            i.status.error = Some(e.to_string());
        }),
    }
}

#[tauri::command]
pub fn update_status(app: AppHandle) -> Status {
    app.state::<Updates>().0.lock().unwrap().status.clone()
}

/// A check by hand (Setelan app's "Cek update"): answers right away with
/// "checking" (or what's already going); the result and the download's
/// progress arrive as "update-status" events.
#[tauri::command]
pub fn update_check(app: AppHandle) -> Status {
    if begin(&app) {
        let handle = app.clone();
        tauri::async_runtime::spawn(async move {
            run(&handle).await;
        });
    }
    update_status(app)
}

/// Installs the downloaded update over this app and relaunches it.
/// Answers (with the error) only when that fails.
#[tauri::command]
pub fn update_install(app: AppHandle) -> Status {
    let ready = {
        let state = app.state::<Updates>();
        let inner = state.0.lock().unwrap();
        inner.ready.clone()
    };
    let Some((update, bytes)) = ready else {
        return update_status(app);
    };
    match update.install(&bytes) {
        Ok(()) => app.restart(),
        Err(e) => set(&app, |i| {
            i.ready = None;
            i.status.phase = "error";
            i.status.error_kind = Some("install");
            i.status.error = Some(e.to_string());
        }),
    }
}
