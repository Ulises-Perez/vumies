// ============================================================================
// Driver de mpv EMBEBIDO en la ventana de la app (Fase 4.5b).
//
// mpv decodifica todo de forma nativa (AC3/DTS/HEVC/mkv…). Para que el vídeo se
// vea DENTRO de la app (y no detrás del webview, que en WebView2 va por encima),
// creamos una VENTANA HIJA Win32 forzada al tope del z-order, confinada al panel
// de vídeo, y le pasamos su HWND a mpv con `--wid`. El frontend mide el panel y
// nos manda la geometría (px físicos) para crear/reubicar esa ventana hija.
// ============================================================================
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicIsize, AtomicU32, Ordering};
use std::sync::OnceLock;
use std::time::Duration;

use serde_json::json;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::sync::{mpsc, Mutex};

use windows::core::w;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallWindowProcW, CreateWindowExW, DefWindowProcW, DestroyWindow, SetWindowLongPtrW,
    SetWindowPos, GWLP_WNDPROC, HWND_TOP, SWP_NOACTIVATE, SWP_SHOWWINDOW, WINDOW_EX_STYLE,
    WINDOW_STYLE, WM_LBUTTONDOWN, WM_MOUSEMOVE, WM_MOUSEWHEEL, WNDPROC, WS_CHILD,
    WS_CLIPSIBLINGS, WS_VISIBLE,
};

const VIDEO_PIPE_RETRIES: u32 = 60;

// ── Detección de actividad del ratón sobre el vídeo ─────────────────────────
// mpv incrustado vía `--wid` deshabilita su propia ventana (EnableWindow(hwnd,0)),
// así que no recibe ratón y uosc no sirve. Los controles son HTML en el webview.
// El contenedor STATIC (con SS_NOTIFY) SÍ recibe el ratón sobre el vídeo:
// subclasamos su WndProc y emitimos eventos Tauri (`mpv-activity`, `mpv-click`)
// para que el frontend muestre/oculte la barra y haga play/pausa al clicar el vídeo.

/// AppHandle global para emitir eventos desde el WndProc (corre en el hilo principal).
static MPV_APP: OnceLock<AppHandle> = OnceLock::new();
/// WndProc original del contenedor, para encadenar con `CallWindowProcW`.
static ORIG_WNDPROC: AtomicIsize = AtomicIsize::new(0);
/// Limita la frecuencia de `mpv-activity` (1 de cada N movimientos) para no saturar el IPC.
static MOVE_TICK: AtomicU32 = AtomicU32::new(0);

fn set_mpv_app(app: AppHandle) {
    let _ = MPV_APP.set(app);
}

/// Emite un evento Tauri sin payload si la app ya está disponible.
fn emit_pointer(event: &str) {
    if let Some(app) = MPV_APP.get() {
        let _ = app.emit(event, ());
    }
}

/// WndProc del contenedor: traduce el ratón sobre el vídeo en eventos para el
/// frontend (mostrar controles / play-pausa) y encadena al proc original.
unsafe extern "system" fn mpv_input_wndproc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    match msg {
        WM_MOUSEMOVE => {
            if MOVE_TICK.fetch_add(1, Ordering::Relaxed) % 6 == 0 {
                emit_pointer("mpv-activity");
            }
        }
        WM_LBUTTONDOWN => {
            emit_pointer("mpv-activity");
            emit_pointer("mpv-click");
        }
        WM_MOUSEWHEEL => emit_pointer("mpv-activity"),
        _ => {}
    }
    let orig = ORIG_WNDPROC.load(Ordering::SeqCst);
    if orig != 0 {
        let proc: WNDPROC = std::mem::transmute(orig);
        CallWindowProcW(proc, hwnd, msg, wparam, lparam)
    } else {
        DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}

struct MpvHandle {
    cmd_tx: mpsc::UnboundedSender<String>,
    /// Se conserva para matar mpv al soltar el handle (kill_on_drop).
    _child: tokio::process::Child,
}

pub struct MpvManager {
    mpv_path: PathBuf,
    app: AppHandle,
    inner: Mutex<Option<MpvHandle>>,
    /// HWND (como isize) de la ventana hija donde pinta mpv.
    container: Mutex<Option<isize>>,
}

impl MpvManager {
    pub fn new(app: AppHandle) -> Self {
        // El WndProc del contenedor emite eventos Tauri usando este AppHandle.
        set_mpv_app(app.clone());
        Self {
            mpv_path: find_mpv().unwrap_or_else(|| PathBuf::from("mpv")),
            app,
            inner: Mutex::new(None),
            container: Mutex::new(None),
        }
    }

    /// Crea (o reubica) la ventana hija sobre el webview. El Win32 corre en el hilo
    /// principal (dueño de la ventana de la app).
    async fn ensure_container(
        &self,
        parent: isize,
        x: i32,
        y: i32,
        cw: i32,
        ch: i32,
    ) -> Result<isize, String> {
        let existing = *self.container.lock().await;
        let (tx, rx) = tokio::sync::oneshot::channel();
        self.app
            .run_on_main_thread(move || {
                let res = unsafe { create_or_move_container(parent, existing, x, y, cw, ch) };
                let _ = tx.send(res);
            })
            .map_err(|e| e.to_string())?;
        let hwnd = rx.await.map_err(|e| e.to_string())??;
        *self.container.lock().await = Some(hwnd);
        Ok(hwnd)
    }

    async fn cmd_sender(&self, wid: Option<isize>) -> Result<mpsc::UnboundedSender<String>, String> {
        let mut guard = self.inner.lock().await;
        if let Some(h) = guard.as_ref() {
            if !h.cmd_tx.is_closed() {
                return Ok(h.cmd_tx.clone());
            }
        }
        let handle = spawn_mpv(&self.mpv_path, self.app.clone(), wid).await?;
        let tx = handle.cmd_tx.clone();
        *guard = Some(handle);
        Ok(tx)
    }
}

fn find_mpv() -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = vec![
        PathBuf::from(r"C:\Program Files\MPV Player\mpv.exe"),
        PathBuf::from(r"C:\Program Files\mpv\mpv.exe"),
    ];
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        candidates.push(PathBuf::from(local).join(r"Microsoft\WinGet\Links\mpv.exe"));
    }
    candidates.into_iter().find(|p| p.exists())
}

/// Directorio de configuración de mpv empaquetado (uosc + tema). En dev vive en
/// `src-tauri/mpv`; en release habría que resolverlo a la carpeta de recursos.
fn mpv_config_dir() -> Option<PathBuf> {
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("mpv");
    if dev.exists() {
        return Some(dev);
    }
    None
}

/// Crea una ventana hija (clase "STATIC") por encima del webview, o la reubica.
unsafe fn create_or_move_container(
    parent: isize,
    existing: Option<isize>,
    x: i32,
    y: i32,
    cw: i32,
    ch: i32,
) -> Result<isize, String> {
    let parent_hwnd = HWND(parent as *mut core::ffi::c_void);
    if let Some(e) = existing {
        let child = HWND(e as *mut core::ffi::c_void);
        let _ = SetWindowPos(child, Some(HWND_TOP), x, y, cw, ch, SWP_SHOWWINDOW | SWP_NOACTIVATE);
        return Ok(e);
    }
    // SS_NOTIFY (0x100): sin él, la clase "STATIC" devuelve HTTRANSPARENT en el
    // hit-test y el ratón ATRAVIESA la ventana hacia el webview, por lo que mpv
    // (y uosc) nunca reciben mouse-move → los controles no aparecen. Con SS_NOTIFY
    // la ventana captura el ratón (HTCLIENT) y mpv/uosc sí lo ven.
    const SS_NOTIFY: u32 = 0x0000_0100;
    let child = CreateWindowExW(
        WINDOW_EX_STYLE(0),
        w!("STATIC"),
        w!(""),
        WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS | WINDOW_STYLE(SS_NOTIFY),
        x,
        y,
        cw,
        ch,
        Some(parent_hwnd),
        None,
        None,
        None,
    )
    .map_err(|e| format!("CreateWindowExW: {e}"))?;
    let _ = SetWindowPos(child, Some(HWND_TOP), x, y, cw, ch, SWP_SHOWWINDOW | SWP_NOACTIVATE);
    // Subclasamos el contenedor para detectar el ratón sobre el vídeo (mpv lo deshabilita)
    // y emitir eventos al frontend (mostrar controles HTML / play-pausa).
    let prev = SetWindowLongPtrW(child, GWLP_WNDPROC, mpv_input_wndproc as usize as isize);
    ORIG_WNDPROC.store(prev, Ordering::SeqCst);
    Ok(child.0 as isize)
}

async fn spawn_mpv(mpv_path: &Path, app: AppHandle, wid: Option<isize>) -> Result<MpvHandle, String> {
    let pipe = format!(r"\\.\pipe\vumies-mpv-{}", std::process::id());
    log::info!("[mpv] lanzando {} (pipe={pipe}, wid={wid:?})", mpv_path.display());

    let mut command = tokio::process::Command::new(mpv_path);
    command
        .arg(format!("--input-ipc-server={pipe}"))
        .arg("--idle=yes")
        .arg("--keep-open=no")
        .arg("--no-terminal")
        .arg("--title=Vumies");
    // uosc dibuja los controles SOBRE el vídeo (full-bleed). El webview reenvía
    // el ratón a mpv vía IPC (`mouse`/`keydown MBTN_LEFT`), así uosc reacciona.
    if let Some(dir) = mpv_config_dir() {
        log::info!("[mpv] config-dir (uosc) = {}", dir.display());
        command.arg(format!("--config-dir={}", dir.display()));
    } else {
        log::warn!("[mpv] sin config-dir de uosc");
    }
    // Log de mpv para depurar sin ver la pantalla.
    let log_path = std::env::temp_dir().join("vumies-mpv.log");
    command.arg(format!("--log-file={}", log_path.display()));
    match wid {
        Some(w) => {
            command.arg(format!("--wid={w}"));
        }
        None => {
            command.arg("--force-window=yes");
        }
    }
    let child = command
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("no se pudo iniciar mpv ({}): {e}", mpv_path.display()))?;

    let client = connect_pipe(&pipe).await?;
    let (reader, mut writer) = tokio::io::split(client);
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // Observa propiedades: time-pos para detectar el primer frame (ocultar la portada)
    // y `user-data/vumies/nav`, que escriben los botones de uosc (Volver/Fuentes/…).
    for (id, prop) in [
        (1u64, "time-pos"),
        (2, "duration"),
        (3, "pause"),
        (4, "volume"),
        (5, "user-data/vumies/nav"),
        (6, "track-list"),
    ] {
        let _ = tx.send(json!({ "command": ["observe_property", id, prop] }).to_string());
    }

    tokio::spawn(async move {
        let mut lines = BufReader::new(reader).lines();
        loop {
            tokio::select! {
                cmd = rx.recv() => {
                    match cmd {
                        Some(c) => {
                            if writer.write_all(c.as_bytes()).await.is_err() { break; }
                            if writer.write_all(b"\n").await.is_err() { break; }
                            let _ = writer.flush().await;
                        }
                        None => break,
                    }
                }
                line = lines.next_line() => {
                    match line {
                        Ok(Some(l)) => {
                            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&l) {
                                match v.get("event").and_then(|e| e.as_str()) {
                                    Some("end-file") => {
                                        let reason = v.get("reason").and_then(|r| r.as_str()).unwrap_or("").to_string();
                                        let _ = app.emit("mpv-ended", reason);
                                    }
                                    Some("property-change") => {
                                        let name = v.get("name").and_then(|n| n.as_str()).unwrap_or("");
                                        let data = v.get("data").cloned().unwrap_or(serde_json::Value::Null);
                                        if name == "user-data/vumies/nav" {
                                            // Acción de un botón de uosc (Volver/Fuentes/Episodios/Fullscreen).
                                            if let Some(action) = data.as_str() {
                                                if !action.is_empty() {
                                                    let _ = app.emit("mpv-nav", action.to_string());
                                                }
                                            }
                                        } else {
                                            let _ = app.emit("mpv-prop", json!({ "name": name, "data": data }));
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                        Ok(None) | Err(_) => break,
                    }
                }
            }
        }
        let _ = app.emit("mpv-stopped", ());
    });

    log::info!("[mpv] instancia lista ({})", mpv_path.display());
    Ok(MpvHandle { cmd_tx: tx, _child: child })
}

async fn connect_pipe(
    name: &str,
) -> Result<tokio::net::windows::named_pipe::NamedPipeClient, String> {
    use tokio::net::windows::named_pipe::ClientOptions;
    for _ in 0..VIDEO_PIPE_RETRIES {
        match ClientOptions::new().open(name) {
            Ok(c) => return Ok(c),
            Err(_) => tokio::time::sleep(Duration::from_millis(100)).await,
        }
    }
    Err("tiempo de espera agotado conectando al IPC de mpv".into())
}

fn parent_hwnd(window: &tauri::WebviewWindow) -> Option<isize> {
    window.hwnd().ok().map(|h| h.0 as isize)
}

#[tauri::command]
pub async fn mpv_play(
    window: tauri::WebviewWindow,
    mgr: tauri::State<'_, MpvManager>,
    url: String,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
) -> Result<(), String> {
    let parent = parent_hwnd(&window).ok_or_else(|| "sin HWND de ventana".to_string())?;
    let child = mgr.ensure_container(parent, x, y, width, height).await?;
    log::info!("[mpv] mpv_play (container={child}) {x},{y} {width}x{height}: {url}");

    let tx = mgr.cmd_sender(Some(child)).await.map_err(|e| {
        log::error!("[mpv] no se pudo iniciar mpv: {e}");
        e
    })?;
    tx.send(json!({ "command": ["loadfile", url, "replace"] }).to_string())
        .map_err(|e| e.to_string())?;
    log::info!("[mpv] loadfile enviado");
    Ok(())
}

/// Reubica la ventana de vídeo (resize de la app, mostrar/ocultar sidebar…).
#[tauri::command]
pub async fn mpv_set_geometry(
    window: tauri::WebviewWindow,
    mgr: tauri::State<'_, MpvManager>,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
) -> Result<(), String> {
    // No crear el contenedor si aún no se está reproduciendo.
    if mgr.container.lock().await.is_none() {
        return Ok(());
    }
    let parent = parent_hwnd(&window).ok_or_else(|| "sin HWND de ventana".to_string())?;
    mgr.ensure_container(parent, x, y, width, height).await?;
    Ok(())
}

/// Comando genérico (pause/seek/volume…) reenviado tal cual a mpv.
#[tauri::command]
pub async fn mpv_command(
    mgr: tauri::State<'_, MpvManager>,
    command: Vec<serde_json::Value>,
) -> Result<(), String> {
    let tx = {
        let guard = mgr.inner.lock().await;
        guard.as_ref().map(|h| h.cmd_tx.clone())
    };
    let tx = tx.ok_or_else(|| "mpv no está en ejecución".to_string())?;
    tx.send(json!({ "command": command }).to_string())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn mpv_stop(mgr: tauri::State<'_, MpvManager>) -> Result<(), String> {
    {
        let mut guard = mgr.inner.lock().await;
        *guard = None; // drop del handle → kill_on_drop termina mpv
    }
    let container = mgr.container.lock().await.take();
    if let Some(c) = container {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let _ = mgr.app.run_on_main_thread(move || {
            unsafe {
                let _ = DestroyWindow(HWND(c as *mut core::ffi::c_void));
            }
            let _ = tx.send(());
        });
        let _ = rx.await;
    }
    Ok(())
}
