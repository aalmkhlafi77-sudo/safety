// AMAN - Windows Desktop Vault Application
// Designer: Abdullah Al-Makhlafi 2026

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running AMAN Desktop Vault");
}
