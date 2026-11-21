mod keychain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // `opener` is the only plugin enabled, and its capability file narrows
        // it to the mailto:, https: and WhatsApp URLs the admin workflows need.
        .plugin(tauri_plugin_opener::init())
        // Checks GitHub Releases for a newer signed build and installs it;
        // `process` is only used to relaunch the app once the update lands.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            keychain::store_session,
            keychain::load_session,
            keychain::clear_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Halabi Online Admin");
}
