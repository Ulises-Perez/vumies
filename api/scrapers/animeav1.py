"""
Scraper de animeav1.com.

El sitio está hecho con SvelteKit y renderiza en el servidor: todo el estado de
cada página viene embebido como JSON dentro del HTML. En lugar de parsear el DOM
con selectores CSS (frágil), extraemos ese payload directamente — el mismo
enfoque del repo FxxMorgan/anime1v-api, pero en Python con Scrapling.
"""

from scrapling.fetchers import Fetcher
from .svelte import (
    extract_sveltekit_data,
    walk,
    first_object_by_key,
    collect_by_key,
)
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from tmdb_map import mal_to_tmdb, mal_type  # noqa: E402

import re

BASE_URL = "https://animeav1.com"
CDN_URL = "https://cdn.animeav1.com"

_fetcher = Fetcher()

STATUS_LABELS = {1: "Finalizado", 2: "En emisión", 3: "Próximamente"}

# Tipos de relación en animeav1
REL_PREQUEL = 1
REL_SEQUEL = 2
REL_MOVIE = 5
REL_SPINOFF = 10

# Cache en memoria del objeto `media` por slug (evita refetch al recorrer cadenas)
_media_cache: dict = {}


def _get_data(url: str):
    """Descarga la página y devuelve el payload SvelteKit parseado."""
    res = _fetcher.get(url, timeout=20, retries=2)
    data = extract_sveltekit_data(res.body)
    if data is None:
        raise ValueError(f"No se pudo extraer el payload SvelteKit de {url}")
    return data


def _get_media(slug: str):
    """Devuelve el objeto `media` de un anime por slug (con cache)."""
    if slug in _media_cache:
        return _media_cache[slug]
    data = _get_data(f"{BASE_URL}/media/{slug}")
    media = first_object_by_key(data, "media")
    if media:
        _media_cache[slug] = media
    return media


def _cover(media: dict) -> str:
    poster = media.get("poster")
    if poster:
        return poster if str(poster).startswith("http") else f"{CDN_URL}/{str(poster).lstrip('/')}"
    if media.get("id"):
        return f"{CDN_URL}/covers/{media['id']}.jpg"
    return ""


def _backdrop(media: dict) -> str:
    backdrop = media.get("backdrop")
    if backdrop:
        return backdrop if str(backdrop).startswith("http") else f"{CDN_URL}/{str(backdrop).lstrip('/')}"
    if media.get("id"):
        return f"{CDN_URL}/backdrops/{media['id']}.jpg"
    return ""


def _category_name(media: dict) -> str:
    cat = media.get("category")
    if isinstance(cat, dict):
        return cat.get("name", "")
    return media.get("type") or ""


def _media_card(media: dict) -> dict:
    """Convierte un objeto media del payload en una card uniforme."""
    return {
        "id": media.get("id"),
        "title": media.get("title", ""),
        "slug": media.get("slug", ""),
        "url": f"{BASE_URL}/media/{media.get('slug', '')}" if media.get("slug") else "",
        "image": _cover(media),
        "type": _category_name(media),
        "synopsis": media.get("synopsis", "") or "",
    }


# ── HOME ──────────────────────────────────────────────────────────────────────

def _first_list(data, key):
    return next((v for v in collect_by_key(data, key) if isinstance(v, list)), [])


def get_recents():
    data = _get_data(BASE_URL)

    latest_episodes = _first_list(data, "latestEpisodes")
    latest_media = _first_list(data, "latestMedia")

    recent_episodes = []
    for ep in latest_episodes:
        if not isinstance(ep, dict):
            continue
        media = ep.get("media", {}) if isinstance(ep.get("media"), dict) else {}
        number = ep.get("number")
        slug = media.get("slug", "")
        recent_episodes.append({
            "title": media.get("title", ""),
            "slug": slug,
            "episode": number,
            "url": f"{BASE_URL}/media/{slug}/{number}" if slug else "",
            "image": f"{CDN_URL}/screenshots/{media.get('id')}/{number}.jpg" if media.get("id") else "",
            "type": _category_name(media),
        })

    recent_anime = [_media_card(m) for m in latest_media if isinstance(m, dict)]

    return {
        "recent_episodes": recent_episodes,
        "recent_anime": recent_anime,
    }


# ── SEARCH / CATALOG ──────────────────────────────────────────────────────────

def search_anime(query: str):
    data = _get_data(f"{BASE_URL}/catalogo?search={query}")
    results = first_object_by_key(data, "results")
    if not isinstance(results, list):
        results = next((r for r in collect_by_key(data, "results") if isinstance(r, list)), [])
    return [_media_card(m) for m in results if isinstance(m, dict)]


def get_catalog(page_num: int = 1, genre: str = ""):
    params = f"?page={page_num}"
    if genre:
        params += f"&genre={genre}"
    data = _get_data(f"{BASE_URL}/catalogo{params}")

    results = first_object_by_key(data, "results")
    if not isinstance(results, list):
        results = next((r for r in collect_by_key(data, "results") if isinstance(r, list)), [])

    total_pages = next((v for v in collect_by_key(data, "totalPages") if isinstance(v, int)), None)
    total_records = next((v for v in collect_by_key(data, "totalRecords") if isinstance(v, int)), None)

    return {
        "results": [_media_card(m) for m in results if isinstance(m, dict)],
        "page": page_num,
        "total_pages": total_pages,
        "total_records": total_records,
    }


# ── ANIME INFO ────────────────────────────────────────────────────────────────

def _classify_relations(media: dict) -> dict:
    """Agrupa las relaciones de un anime por tipo."""
    grouped = {"prequel": [], "sequel": [], "movies": [], "spinoffs": [], "other": []}
    for rel in (media.get("relations") or []):
        if not isinstance(rel, dict):
            continue
        dest = rel.get("destination") or {}
        item = {
            "title": dest.get("title", ""),
            "slug": dest.get("slug", ""),
            "start_date": dest.get("startDate", ""),
        }
        if not item["slug"]:
            continue
        t = rel.get("type")
        if t == REL_PREQUEL:
            grouped["prequel"].append(item)
        elif t == REL_SEQUEL:
            grouped["sequel"].append(item)
        elif t == REL_MOVIE:
            grouped["movies"].append(item)
        elif t == REL_SPINOFF:
            grouped["spinoffs"].append(item)
        else:
            grouped["other"].append(item)
    return grouped


def _build_anime_info(media: dict, anime_url: str = "") -> dict:
    slug = media.get("slug", "")
    genres = [
        {"name": g.get("name"), "slug": g.get("slug")}
        for g in (media.get("genres") or [])
        if isinstance(g, dict)
    ]

    episodes = []
    for ep in (media.get("episodes") or []):
        if not isinstance(ep, dict):
            continue
        number = ep.get("number")
        episodes.append({
            "id": ep.get("id"),
            "number": number,
            "url": f"{BASE_URL}/media/{slug}/{number}" if slug else "",
            "image": f"{CDN_URL}/screenshots/{media.get('id')}/{number}.jpg" if media.get("id") else "",
        })

    aka = media.get("aka") or {}
    alt_title = ""
    if isinstance(aka, dict):
        alt_title = aka.get("ja-jp") or aka.get("ja") or aka.get("jp") or aka.get("en-us") or ""

    status_code = media.get("status")
    start_date = media.get("startDate") or ""
    year = start_date[:4] if start_date else (str(media.get("year")) if media.get("year") else "")

    mal_id = media.get("malId")
    tmdb = mal_to_tmdb(mal_id) if mal_id else None

    return {
        "id": media.get("id"),
        "title": media.get("title", ""),
        "alt_title": alt_title,
        "slug": slug,
        "type": _category_name(media),
        "year": year,
        "start_date": start_date,
        "status_code": status_code,
        "status": STATUS_LABELS.get(status_code, ""),
        "genres": genres,
        "description": media.get("synopsis", "") or "",
        "cover": _cover(media),
        "backdrop": _backdrop(media),
        "rating": media.get("score"),
        "votes": media.get("votes"),
        "mal_id": mal_id,
        "tmdb": tmdb,
        "trailer": media.get("trailer"),
        "episodes_count": media.get("episodesCount") or len(episodes),
        "episodes": episodes,
        "relations": _classify_relations(media),
        "url": anime_url or (f"{BASE_URL}/media/{slug}" if slug else ""),
    }


def get_anime_info(anime_url: str):
    data = _get_data(anime_url)
    media = first_object_by_key(data, "media")
    if not media:
        raise ValueError("No se encontró información del anime")
    if media.get("slug"):
        _media_cache[media["slug"]] = media
    return _build_anime_info(media, anime_url)


# ── FRANQUICIA / TEMPORADAS ───────────────────────────────────────────────────

_MOVIE_TITLE_RE = re.compile(r"\b(movie|film|gekijou|the movie|recap|special|ova|ona)\b", re.I)


def _is_tv(media: dict) -> bool:
    """
    Determina si un anime es una temporada de TV (no película/OVA/spin-off).

    La categoría de animeav1 no es fiable (marca películas como 'TV Anime'),
    así que priorizamos el tipo real del dataset Fribb vía malId. Fallback:
    categoría tv-anime + heurística de título.
    """
    ftype = mal_type(media.get("malId"))
    if ftype:
        return ftype.upper() == "TV"
    # Fallback sin mapeo Fribb
    cat = media.get("category")
    is_cat_tv = isinstance(cat, dict) and cat.get("slug") == "tv-anime"
    title = media.get("title", "") or ""
    return is_cat_tv and not _MOVIE_TITLE_RE.search(title)


def _season_entry(media: dict) -> dict:
    """Resumen ligero de una temporada (sin episodios completos)."""
    return {
        "slug": media.get("slug", ""),
        "title": media.get("title", ""),
        "year": (media.get("startDate") or "")[:4],
        "start_date": media.get("startDate") or "",
        "episodes_count": media.get("episodesCount") or len(media.get("episodes") or []),
        "cover": _cover(media),
    }


def get_franchise(slug: str) -> dict:
    """
    Construye la cadena ordenada de temporadas TV de una franquicia siguiendo
    las relaciones prequel/sequel de animeav1, partiendo desde `slug`.

    Devuelve {'seasons': [...ordenadas...], 'current': slug}.
    Solo incluye entradas TV (excluye películas y spin-offs).
    """
    media = _get_media(slug)
    if not media:
        raise ValueError("No se encontró el anime")

    visited = {slug}

    # 1) Retroceder por precuelas hasta la raíz
    root = media
    while True:
        prequels = [
            r for r in (root.get("relations") or [])
            if isinstance(r, dict) and r.get("type") == REL_PREQUEL
        ]
        moved = False
        for rel in prequels:
            dest_slug = (rel.get("destination") or {}).get("slug")
            if not dest_slug or dest_slug in visited:
                continue
            cand = _get_media(dest_slug)
            if cand and _is_tv(cand):
                visited.add(dest_slug)
                root = cand
                moved = True
                break
        if not moved:
            break

    # 2) Avanzar por secuelas TV desde la raíz
    seasons = [root]
    seen = {root.get("slug")}
    cursor = root
    while True:
        sequels = [
            r for r in (cursor.get("relations") or [])
            if isinstance(r, dict) and r.get("type") == REL_SEQUEL
        ]
        nxt = None
        for rel in sequels:
            dest_slug = (rel.get("destination") or {}).get("slug")
            if not dest_slug or dest_slug in seen:
                continue
            cand = _get_media(dest_slug)
            if cand and _is_tv(cand):
                nxt = cand
                break
        if not nxt:
            break
        seasons.append(nxt)
        seen.add(nxt.get("slug"))
        cursor = nxt

    return {
        "current": slug,
        "seasons": [_season_entry(m) for m in seasons],
    }


# ── EPISODE ───────────────────────────────────────────────────────────────────

def get_episode_links(episode_url: str):
    data = _get_data(episode_url)

    episode = first_object_by_key(data, "episode") or {}
    embeds = first_object_by_key(data, "embeds") or {}

    def _servers(variant):
        items = embeds.get(variant) or []
        return [
            {"server": s.get("server", ""), "url": s.get("url", "")}
            for s in items
            if isinstance(s, dict) and s.get("url")
        ]

    sub = _servers("SUB")
    dub = _servers("DUB")

    return {
        "id": episode.get("id"),
        "number": episode.get("number"),
        "title": episode.get("title") or f"Episodio {episode.get('number', '')}",
        "url": episode_url,
        "variants": episode.get("variants") or {},
        "servers": {
            "SUB": sub,
            "DUB": dub,
        },
        # Conveniencia: primer servidor SUB (normalmente el reproductor HLS)
        "default_embed": sub[0]["url"] if sub else (dub[0]["url"] if dub else ""),
    }


# ── HORARIO ───────────────────────────────────────────────────────────────────

_WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def _weekday_from_date(date_str: str):
    """Calcula el día de la semana (en español) desde 'YYYY-MM-DD ...'."""
    try:
        y, m, d = (int(x) for x in date_str[:10].split("-"))
        # Algoritmo de Sakamoto (0 = Lunes)
        t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
        yy = y - (1 if m < 3 else 0)
        dow = (yy + yy // 4 - yy // 100 + yy // 400 + t[m - 1] + d) % 7  # 0=Domingo
        return _WEEKDAYS[(dow + 6) % 7]  # convertir a 0=Lunes
    except Exception:
        return None


def get_schedule():
    data = _get_data(f"{BASE_URL}/horario")

    # El array más grande de objetos media es la grilla de animes en emisión
    candidates = []
    walk(data, lambda n: candidates.append(n) if isinstance(n, list) and n and isinstance(n[0], dict) and "slug" in n[0] else None)
    animes = max(candidates, key=len) if candidates else []

    schedule = {day: [] for day in _WEEKDAYS}
    for media in animes:
        if not isinstance(media, dict):
            continue
        date_ref = media.get("nextDate") or media.get("startDate") or ""
        day = _weekday_from_date(date_ref)
        card = _media_card(media)
        latest = media.get("latestEpisode")
        if isinstance(latest, dict):
            card["latest_episode"] = latest.get("number")
        if day:
            schedule[day].append(card)

    return schedule
