// AMAN - Windows Desktop Vault Application
// Designer: Abdullah Al-Makhlafi 2026

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::Manager;

#[tauri::command]
fn get_vault_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_data).map_err(|e| e.to_string())?;
    let db_path = app_data.join("aman_vault.sqlite");
    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_native_sqlite(app: tauri::AppHandle, data: Vec<u8>) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_data).map_err(|e| e.to_string())?;
    let db_path = app_data.join("aman_vault.sqlite");
    fs::write(db_path, data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_native_sqlite(app: tauri::AppHandle) -> Result<Option<Vec<u8>>, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data.join("aman_vault.sqlite");
    if db_path.exists() {
        let bytes = fs::read(db_path).map_err(|e| e.to_string())?;
        Ok(Some(bytes))
    } else {
        Ok(None)
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_vault_db_path,
            save_native_sqlite,
            load_native_sqlite
        ])
        .run(tauri::generate_context!())
        .expect("error while running AMAN Desktop Vault");
}
