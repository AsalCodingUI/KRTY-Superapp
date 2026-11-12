fn main() {
    // The app's own commands, so the capability can allow them for the web
    // app's pages (remote pages get nothing that isn't allowed by name).
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "open_external",
            "open_in_app",
            "set_tray_title",
            "set_autostart",
            "set_theme",
            "notify",
            "get_autostart",
            "app_info",
            "open_system_settings",
            "notification_status",
            "request_notification_permission",
            "native_edit",
            "update_status",
            "update_check",
            "update_install",
            "lead_show",
            "lead_hide",
            "lead_close",
            "lead_focus",
            "lead_nav",
            "lead_state",
            "lead_report",
            "lead_snapshot",
        ]),
    ))
    .expect("failed to run tauri-build");
}
