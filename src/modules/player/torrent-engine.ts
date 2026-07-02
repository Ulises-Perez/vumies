// Puente al motor torrent nativo (Tauri). En la web no existe `invoke`, así que
// isTauri() permite que la fuente torrent solo se active en el escritorio.

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export interface ResolvedTorrent {
  id: number
  fileId: number
  fileName: string
  fileSize: number
  /** URL HTTP local (127.0.0.1) con soporte Range para reproducir en <video>/mpv. */
  streamUrl: string
}

/** Añade el torrent en el motor local y devuelve la URL de streaming. */
export async function resolveTorrent(infoHash: string): Promise<ResolvedTorrent> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<ResolvedTorrent>('torrent_resolve', { infoHash })
}

/** Geometría (px físicos) del panel de vídeo donde se incrusta mpv. */
export interface MpvGeometry {
  x: number
  y: number
  width: number
  height: number
}

/** Reproduce una URL en mpv embebido en el panel de vídeo (cualquier códec, con audio). */
export async function playInMpv(url: string, geom: MpvGeometry): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('mpv_play', { url, ...geom })
}

/** Reubica/redimensiona la ventana de mpv para que siga al panel de vídeo. */
export async function setMpvGeometry(geom: MpvGeometry): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('mpv_set_geometry', { x: geom.x, y: geom.y, width: geom.width, height: geom.height })
}

/** Envía un comando IPC genérico a mpv (pause/seek/volume…). */
export async function mpvCommand(command: unknown[]): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('mpv_command', { command })
}

/** Salta a un segundo absoluto del vídeo (scrubber). */
export async function mpvSeekTo(seconds: number): Promise<void> {
  await mpvCommand(['seek', Math.max(0, seconds), 'absolute'])
}

/** Ajusta el volumen (0–100). */
export async function mpvSetVolume(volume: number): Promise<void> {
  await mpvCommand(['set_property', 'volume', Math.round(volume)])
}

/** Pausa/reanuda. */
export async function mpvSetPause(paused: boolean): Promise<void> {
  await mpvCommand(['set_property', 'pause', paused])
}

/** Propiedad observada de mpv (time-pos/duration/pause/volume/track-list). */
export interface MpvProp {
  name: string
  /** number (time-pos/duration/volume) | boolean (pause) | MpvTrack[] (track-list) | null. */
  data: unknown
}

/** Una pista del archivo (audio/subtítulos/vídeo) tal y como la expone mpv. */
export interface MpvTrack {
  id: number
  type: 'audio' | 'sub' | 'video'
  /** Código de idioma ISO (es, en, ja…) si el archivo lo trae. */
  lang?: string
  title?: string
  codec?: string
  selected: boolean
  default?: boolean
  external?: boolean
  /** Nº de canales de audio (2 = estéreo, 6 = 5.1…). */
  'demux-channel-count'?: number
}

/** Escucha cambios de propiedades de mpv (para el scrubber/volumen/estado/pistas). */
export async function onMpvProp(cb: (p: MpvProp) => void): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event')
  return listen<MpvProp>('mpv-prop', (e) => cb(e.payload))
}

/** Selecciona la pista de audio (id de la track-list). */
export async function setAudioTrack(id: number): Promise<void> {
  await mpvCommand(['set_property', 'aid', id])
}

/** Selecciona la pista de subtítulos (id) o los desactiva ('no'). */
export async function setSubtitleTrack(id: number | 'no'): Promise<void> {
  await mpvCommand(['set_property', 'sid', id])
}

/** Actividad del ratón sobre el vídeo (la emite el WndProc nativo) → mostrar controles. */
export async function onMpvActivity(cb: () => void): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event')
  return listen('mpv-activity', () => cb())
}

/** Clic sobre el vídeo (la emite el WndProc nativo) → pausa/play estilo Stremio. */
export async function onMpvClick(cb: () => void): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event')
  return listen('mpv-click', () => cb())
}

/** Alterna pantalla completa de la VENTANA de la app (mpv es hijo y la sigue). */
export async function toggleAppFullscreen(): Promise<boolean> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  const next = !(await win.isFullscreen())
  await win.setFullscreen(next)
  return next
}

/** Detiene y cierra mpv. */
export async function stopMpv(): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('mpv_stop')
}

/** Escucha el fin de reproducción en mpv (reason 'eof'). Devuelve la función para dejar de escuchar. */
export async function onMpvEnded(cb: () => void): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event')
  return listen<string>('mpv-ended', (e) => {
    if (e.payload === 'eof') cb()
  })
}
