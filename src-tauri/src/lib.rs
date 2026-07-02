// build: vumies player (uosc + mouse-forward via webview)
mod mpv;
mod torrent;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            // Silenciar el ruido de DHT/tracing de librqbit para ver nuestros logs.
            .level_for("librqbit", log::LevelFilter::Off)
            .level_for("librqbit_dht", log::LevelFilter::Off)
            .level_for("librqbit_core", log::LevelFilter::Off)
            .level_for("tracing::span", log::LevelFilter::Off)
            .build(),
        )?;
      }

      // Motor torrent (Fase 3): inicialización perezosa al primer torrent.
      let download_dir = app
        .path()
        .app_cache_dir()
        .unwrap_or_else(|_| std::env::temp_dir())
        .join("vumies-torrents");
      app.manage(torrent::TorrentEngine::new(download_dir));

      // Reproductor mpv (Fase 4): driver sidecar vía IPC.
      app.manage(mpv::MpvManager::new(app.handle().clone()));

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      torrent::torrent_resolve,
      mpv::mpv_play,
      mpv::mpv_set_geometry,
      mpv::mpv_command,
      mpv::mpv_stop,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
