// ============================================================================
// Motor torrent local (Fase 3) — librqbit + servidor de streaming axum.
//
// Modelo Stremio: cada PC corre su propio motor. `torrent_resolve` añade el
// torrent (magnet/infoHash), espera la metadata, elige el mejor archivo de vídeo
// y devuelve una URL HTTP en 127.0.0.1 con soporte Range para que el reproductor
// (hoy <video>, en Fase 4 mpv) la consuma. La inicialización es perezosa: la
// Session solo arranca cuando el usuario reproduce su primer torrent.
// ============================================================================
use std::{io::SeekFrom, path::PathBuf, sync::Arc, time::Duration};

use axum::{
    body::Body,
    extract::{Path as AxumPath, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    routing::get,
    Router,
};
use librqbit::{api::TorrentIdOrHash, AddTorrent, AddTorrentOptions, Api, Session};
use serde::Serialize;
use tokio::{io::AsyncSeekExt, sync::OnceCell};

const VIDEO_EXTS: &[&str] = &[
    "mp4", "mkv", "webm", "avi", "mov", "m4v", "ts", "flv", "wmv", "mpg", "mpeg",
];

/// Trackers públicos: Torrentio entrega solo el infoHash, así que añadimos trackers
/// para descubrir peers sin depender únicamente del DHT (frágil en Windows, err 10054).
const TRACKERS: &[&str] = &[
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.demonii.com:1337/announce",
    "udp://tracker.openbittorrent.com:6969/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://open.stealth.si:80/announce",
    "udp://explodie.org:6969/announce",
    "udp://tracker.dler.org:6969/announce",
    "udp://tracker.tiny-vps.com:6969/announce",
    "udp://tracker1.bt.moack.co.kr:80/announce",
];

fn is_video(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| VIDEO_EXTS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

struct EngineInner {
    api: Arc<Api>,
    port: u16,
}

/// Estado manejado por Tauri. Inicializa la Session + servidor la primera vez.
pub struct TorrentEngine {
    inner: OnceCell<EngineInner>,
    download_dir: PathBuf,
}

impl TorrentEngine {
    pub fn new(download_dir: PathBuf) -> Self {
        Self {
            inner: OnceCell::new(),
            download_dir,
        }
    }

    async fn get(&self) -> Result<&EngineInner, String> {
        self.inner
            .get_or_try_init(|| init_inner(self.download_dir.clone()))
            .await
    }
}

async fn init_inner(download_dir: PathBuf) -> Result<EngineInner, String> {
    std::fs::create_dir_all(&download_dir).ok();

    let session = Session::new(download_dir)
        .await
        .map_err(|e| format!("error creando la sesión torrent: {e}"))?;
    let api = Arc::new(Api::new(session, None));

    // Servidor HTTP local de streaming en un puerto libre.
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("no se pudo abrir el puerto de streaming: {e}"))?;
    let port = listener
        .local_addr()
        .map_err(|e| e.to_string())?
        .port();

    let router = Router::new()
        .route("/stream/{id}/{file_id}", get(stream_handler))
        .with_state(api.clone());

    tauri::async_runtime::spawn(async move {
        if let Err(e) = axum::serve(listener, router).await {
            log::error!("[torrent] servidor de streaming caído: {e}");
        }
    });

    log::info!("[torrent] motor listo en http://127.0.0.1:{port}");
    Ok(EngineInner { api, port })
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedTorrent {
    pub id: usize,
    pub file_id: usize,
    pub file_name: String,
    pub file_size: u64,
    pub stream_url: String,
}

/// Añade el torrent, espera metadata, elige el mejor vídeo y devuelve la URL local.
#[tauri::command]
pub async fn torrent_resolve(
    engine: tauri::State<'_, TorrentEngine>,
    info_hash: String,
) -> Result<ResolvedTorrent, String> {
    let inner = engine.get().await?;
    log::info!("[torrent] resolve infoHash={info_hash}");

    let magnet = if info_hash.starts_with("magnet:") {
        info_hash.clone()
    } else {
        format!("magnet:?xt=urn:btih:{info_hash}")
    };

    // overwrite=true para reanudar torrents ya descargados (re-reproducir); trackers
    // públicos para descubrir peers vía tracker además del DHT.
    let opts = AddTorrentOptions {
        overwrite: true,
        trackers: Some(TRACKERS.iter().map(|s| s.to_string()).collect()),
        ..Default::default()
    };
    // Timeout: api_add_torrent bloquea hasta tener la metadata; si el torrent no
    // tiene peers, no debe colgar eternamente.
    let resp = tokio::time::timeout(
        Duration::from_secs(45),
        inner.api.api_add_torrent(AddTorrent::from_url(&magnet), Some(opts)),
    )
    .await
    .map_err(|_| {
        "tiempo agotado obteniendo la metadata del torrent (sin peers). Prueba otra fuente.".to_string()
    })?
    .map_err(|e| format!("error añadiendo el torrent: {e}"))?;

    let id = resp.id.ok_or_else(|| "respuesta sin id de torrent".to_string())?;
    log::info!("[torrent] añadido id={id}, esperando metadata…");
    let handle = inner
        .api
        .mgr_handle(TorrentIdOrHash::from(id))
        .map_err(|e| e.to_string())?;

    // Esperar a que la lista de archivos (metadata) esté disponible.
    handle
        .wait_until_initialized()
        .await
        .map_err(|e| format!("error obteniendo metadata del torrent: {e}"))?;

    // Elegir el archivo de vídeo más grande (o el mayor de cualquier tipo si no hay vídeo).
    let chosen = handle
        .with_metadata(|m| {
            let mut best_video: Option<usize> = None;
            let mut best_video_len = 0u64;
            let mut best_any: Option<usize> = None;
            let mut best_any_len = 0u64;

            for (i, fi) in m.file_infos.iter().enumerate() {
                if best_any.is_none() || fi.len > best_any_len {
                    best_any = Some(i);
                    best_any_len = fi.len;
                }
                if is_video(&fi.relative_filename) && (best_video.is_none() || fi.len > best_video_len) {
                    best_video = Some(i);
                    best_video_len = fi.len;
                }
            }

            best_video.or(best_any).map(|i| {
                let fi = &m.file_infos[i];
                (i, fi.relative_filename.to_string_lossy().into_owned(), fi.len)
            })
        })
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "el torrent no contiene archivos".to_string())?;

    let (file_id, file_name, file_size) = chosen;
    let stream_url = format!("http://127.0.0.1:{}/stream/{}/{}", inner.port, id, file_id);
    log::info!("[torrent] listo: file_id={file_id} '{file_name}' {file_size}B → {stream_url}");

    Ok(ResolvedTorrent {
        id,
        file_id,
        file_name,
        file_size,
        stream_url,
    })
}

/// Sirve un archivo del torrent por HTTP con soporte de Range (réplica del handler de librqbit).
async fn stream_handler(
    State(api): State<Arc<Api>>,
    AxumPath((id, file_id)): AxumPath<(usize, usize)>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let tid = TorrentIdOrHash::from(id);
    let mut stream = api
        .api_stream(tid, file_id)
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let mut status = StatusCode::OK;
    let mut out = HeaderMap::new();
    out.insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));

    if let Ok(mime) = api.torrent_file_mime_type(tid, file_id) {
        if let Ok(v) = HeaderValue::from_str(mime) {
            out.insert(header::CONTENT_TYPE, v);
        }
    }

    if let Some(range) = headers.get(header::RANGE) {
        let offset: Option<u64> = range
            .to_str()
            .ok()
            .and_then(|s| s.strip_prefix("bytes="))
            .and_then(|s| s.strip_suffix('-'))
            .and_then(|s| s.parse().ok());
        if let Some(offset) = offset {
            status = StatusCode::PARTIAL_CONTENT;
            stream
                .seek(SeekFrom::Start(offset))
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            if let Ok(v) = HeaderValue::from_str(&format!("{}", stream.len() - stream.position())) {
                out.insert(header::CONTENT_LENGTH, v);
            }
            if let Ok(v) = HeaderValue::from_str(&format!(
                "bytes {}-{}/{}",
                stream.position(),
                stream.len().saturating_sub(1),
                stream.len()
            )) {
                out.insert(header::CONTENT_RANGE, v);
            }
        }
    } else if let Ok(v) = HeaderValue::from_str(&format!("{}", stream.len())) {
        out.insert(header::CONTENT_LENGTH, v);
    }

    let body = Body::from_stream(tokio_util::io::ReaderStream::with_capacity(stream, 65536));
    Ok((status, out, body))
}
