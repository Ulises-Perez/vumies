//! Proxy de la API de listado de Vimeus.
//!
//! La API Key de Vimeus no puede llegar al webview: la documentación exige que
//! viva sólo en el backend ("Úsala solo en backend, nunca en frontend") y, además,
//! un webview de Tauri no puede hacer peticiones cross-origin a `vimeus.net`.
//!
//! Este módulo resuelve la clave en tiempo de ejecución (variable de entorno o
//! archivo `.env` fuera del repositorio) y firma la petición con el header
//! `X-API-Key` desde el lado nativo.
//!
//! Orden de resolución de la clave:
//!   1. Variable de entorno `VIMEUS_API_KEY` del proceso.
//!   2. `.env` junto al ejecutable (build empaquetado).
//!   3. `.env` en el directorio de configuración de la app (`app_config_dir`).
//!   4. `.env` en la raíz del repositorio, sólo en builds de desarrollo.

use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::Deserialize;
use serde_json::Value;
use tauri::Manager;

const BASE_URL: &str = "https://vimeus.net";
const API_KEY_ENV: &str = "VIMEUS_API_KEY";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);

/// Endpoints de listado válidos documentados por Vimeus.
const LISTING_KINDS: [&str; 4] = ["movies", "series", "animes", "episodes"];

/// Parámetros de una consulta de listado. Los nombres viajan en camelCase desde
/// el frontend para respetar la convención de TypeScript.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListingRequest {
    /// `movies` | `series` | `animes` | `episodes`
    pub kind: String,
    pub page: Option<u32>,
    /// Filtro por ID de TMDB (usado por `episodes`).
    pub tmdb_id: Option<u64>,
    /// Filtro por temporada; requiere `tmdbId`.
    pub season: Option<u32>,
    /// Restringe la respuesta a contenido con embed compatible con CF token.
    pub with_cf: Option<bool>,
}

/// Ejecuta `GET /api/listing/{kind}` autenticado y devuelve el JSON de respuesta.
#[tauri::command]
pub async fn vimeus_listing(
    app: tauri::AppHandle,
    request: ListingRequest,
) -> Result<Value, String> {
    let kind = request.kind.trim().to_lowercase();
    if !LISTING_KINDS.contains(&kind.as_str()) {
        return Err(format!(
            "Tipo de listado de Vimeus no válido: '{}' (esperado uno de: {})",
            request.kind,
            LISTING_KINDS.join(", ")
        ));
    }

    let page = request.page.unwrap_or(1).max(1);
    if request.season.is_some() && request.tmdb_id.is_none() {
        return Err("El filtro 'season' requiere 'tmdbId'.".to_string());
    }

    let api_key = resolve_api_key(&app).ok_or_else(missing_key_message)?;

    let mut query: Vec<(&str, String)> = vec![("page", page.to_string())];
    if let Some(tmdb_id) = request.tmdb_id {
        query.push(("tmdb_id", tmdb_id.to_string()));
    }
    if let Some(season) = request.season {
        query.push(("season", season.to_string()));
    }
    if request.with_cf.unwrap_or(false) {
        query.push(("with_cf", "true".to_string()));
    }

    let url = format!("{BASE_URL}/api/listing/{kind}");
    let client = reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|e| format!("No se pudo crear el cliente HTTP: {e}"))?;

    let response = client
        .get(&url)
        .query(&query)
        .header("X-API-Key", api_key)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Error de red consultando Vimeus: {e}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| format!("No se pudo leer la respuesta de Vimeus: {e}"))?;

    // La API documenta 401 (clave inválida), 400 (página inválida) y 404 (sin
    // contenido) con un cuerpo `{ error, message, data }`; se propaga el mensaje.
    let parsed: Value = match serde_json::from_str(&body) {
        Ok(value) => value,
        Err(_) => {
            return Err(format!(
                "Respuesta de Vimeus no interpretable como JSON (HTTP {status})"
            ))
        }
    };

    if !status.is_success() {
        let message = parsed
            .get("message")
            .and_then(Value::as_str)
            .unwrap_or("error desconocido");
        return Err(format!("Vimeus respondió HTTP {status}: {message}"));
    }

    Ok(parsed)
}

fn missing_key_message() -> String {
    format!(
        "Falta la API Key de Vimeus. Definí la variable de entorno {API_KEY_ENV} \
         (por ejemplo con `setx {API_KEY_ENV} \"tu_api_key\"`) o creá un archivo .env \
         con la línea {API_KEY_ENV}=... junto al ejecutable, en la carpeta de \
         configuración de la app o en la raíz del repositorio durante el desarrollo. \
         La clave nunca se lee desde el frontend."
    )
}

/// Resuelve la API Key sin exponerla en logs ni en mensajes de error.
fn resolve_api_key(app: &tauri::AppHandle) -> Option<String> {
    if let Ok(value) = std::env::var(API_KEY_ENV) {
        let value = value.trim().to_string();
        if !value.is_empty() {
            return Some(value);
        }
    }

    for dir in candidate_dirs(app) {
        if let Some(value) = read_env_value(&dir.join(".env"), API_KEY_ENV) {
            return Some(value);
        }
    }

    None
}

/// Directorios donde se busca el `.env`, en orden de prioridad.
fn candidate_dirs(app: &tauri::AppHandle) -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            dirs.push(parent.to_path_buf());
        }
    }

    if let Ok(config_dir) = app.path().app_config_dir() {
        dirs.push(config_dir);
    }

    // Sólo en desarrollo: raíz del repositorio (el binario vive en src-tauri/target).
    if cfg!(debug_assertions) {
        if let Some(manifest_dir) = option_env!("CARGO_MANIFEST_DIR") {
            let manifest_dir = Path::new(manifest_dir);
            dirs.push(manifest_dir.to_path_buf());
            if let Some(root) = manifest_dir.parent() {
                dirs.push(root.to_path_buf());
            }
        }
    }

    dirs
}

/// Lee una clave de un archivo estilo `.env` (`KEY=valor`, admite comillas y `export`).
fn read_env_value(path: &Path, key: &str) -> Option<String> {
    let content = std::fs::read_to_string(path).ok()?;

    for raw_line in content.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let line = line.strip_prefix("export ").unwrap_or(line);

        let Some((name, value)) = line.split_once('=') else {
            continue;
        };
        if name.trim() != key {
            continue;
        }

        let value = value.trim().trim_matches('"').trim_matches('\'').trim();
        if !value.is_empty() {
            return Some(value.to_string());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_plain_and_quoted_values() {
        let dir = std::env::temp_dir().join("vumies-env-test");
        std::fs::create_dir_all(&dir).unwrap();

        let plain = dir.join("plain.env");
        std::fs::write(&plain, "OTHER=1\nVIMEUS_API_KEY=ak_123\n").unwrap();
        assert_eq!(
            read_env_value(&plain, API_KEY_ENV),
            Some("ak_123".to_string())
        );

        let quoted = dir.join("quoted.env");
        std::fs::write(&quoted, "# comment\nexport VIMEUS_API_KEY=\"ak_456\"\n").unwrap();
        assert_eq!(
            read_env_value(&quoted, API_KEY_ENV),
            Some("ak_456".to_string())
        );

        let empty = dir.join("empty.env");
        std::fs::write(&empty, "VIMEUS_API_KEY=\n").unwrap();
        assert_eq!(read_env_value(&empty, API_KEY_ENV), None);

        let missing = dir.join("missing.env");
        assert_eq!(read_env_value(&missing, API_KEY_ENV), None);
    }

    #[test]
    fn missing_message_names_the_expected_variable() {
        assert!(missing_key_message().contains(API_KEY_ENV));
    }
}
