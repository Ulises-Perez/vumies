"""
Mapeo MyAnimeList ID -> TheMovieDB ID usando el dataset Fribb/anime-lists.

animeav1 expone `malId` por anime. TMDB no indexa MAL IDs, así que usamos el
dataset comunitario Fribb (anime-list-mini.json) que mapea
mal_id -> themoviedb_id {tv|movie} y tipo. Esto permite enriquecer cada anime
con backdrops/posters/ratings de TMDB.

El dataset (~5.7MB) se descarga una vez y se cachea en disco.
"""

import json
import os
import time
import urllib.request

FRIBB_URL = "https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-mini.json"
CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
CACHE_FILE = os.path.join(CACHE_DIR, "fribb-anime-list.json")
CACHE_TTL = 7 * 24 * 3600  # 7 días

_index: dict | None = None  # mal_id (int) -> entry


def _download():
    os.makedirs(CACHE_DIR, exist_ok=True)
    req = urllib.request.Request(FRIBB_URL, headers={"User-Agent": "Vumies/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
    with open(CACHE_FILE, "wb") as fh:
        fh.write(raw)
    return json.loads(raw)


def _load():
    """Carga el dataset desde cache (si está fresco) o lo descarga."""
    fresh = (
        os.path.exists(CACHE_FILE)
        and (time.time() - os.path.getmtime(CACHE_FILE)) < CACHE_TTL
    )
    if fresh:
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            pass
    try:
        return _download()
    except Exception:
        # Si la descarga falla pero hay cache vieja, úsala
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as fh:
                return json.load(fh)
        raise


def _ensure_index():
    global _index
    if _index is None:
        data = _load()
        _index = {}
        for entry in data:
            mal = entry.get("mal_id")
            if isinstance(mal, int):
                _index[mal] = entry
    return _index


def mal_type(mal_id):
    """Devuelve el tipo real según Fribb ('TV', 'MOVIE', 'OVA', 'ONA', ...) o None."""
    if not mal_id:
        return None
    try:
        idx = _ensure_index()
    except Exception:
        return None
    entry = idx.get(int(mal_id))
    return entry.get("type") if entry else None


def mal_to_tmdb(mal_id):
    """
    Devuelve {'tmdb_id': int, 'media_type': 'tv'|'movie', 'season': int|None}
    o None si no hay mapeo.
    """
    if not mal_id:
        return None
    try:
        idx = _ensure_index()
    except Exception:
        return None

    entry = idx.get(int(mal_id))
    if not entry:
        return None

    tmdb = entry.get("themoviedb_id")
    if not isinstance(tmdb, dict):
        # A veces themoviedb_id es un int directo (tv)
        if isinstance(tmdb, int):
            return {"tmdb_id": tmdb, "media_type": "tv", "season": None}
        return None

    media_type = "tv" if "tv" in tmdb else ("movie" if "movie" in tmdb else None)
    if not media_type:
        return None

    season = entry.get("season")
    season_num = season.get("tmdb") if isinstance(season, dict) else None

    return {
        "tmdb_id": tmdb[media_type],
        "media_type": media_type,
        "season": season_num,
    }
