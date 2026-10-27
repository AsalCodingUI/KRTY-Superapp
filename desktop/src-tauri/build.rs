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
        ]),
    ))
    .expect("failed to run tauri-build");
}
