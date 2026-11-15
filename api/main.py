import logging
import os
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from scrapers.animeav1 import (
    get_recents,
    search_anime,
    get_catalog,
    get_anime_info,
    get_episode_links,
    get_schedule,
    get_franchise,
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AnimeAV1 API",
    description="Scraping API para animeav1.com",
    version="1.0.0",
)

# Sin credenciales: el navegador rechaza el comodin "*" combinado con
# allow_credentials=True, y esta API solo sirve GET publicos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Los endpoints que reciben una URL la pasan al scraper, que hace fetch de lo que
# le den: sin esta lista seria un proxy abierto (SSRF).
ALLOWED_HOSTS = {"animeav1.com", "www.animeav1.com"}


def _safe_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or parsed.hostname not in ALLOWED_HOSTS:
        raise HTTPException(status_code=400, detail="URL no permitida")
    return url


def _upstream_error(exc: Exception) -> HTTPException:
    # El detalle va al log, no al cliente: str(e) filtra rutas e internals.
    logger.exception("Error consultando animeav1", exc_info=exc)
    return HTTPException(status_code=502, detail="Error consultando animeav1")


# Sin VUMIES_API_KEY en el entorno la API queda abierta (desarrollo local). Con
# la variable puesta, todo endpoint de datos exige la cabecera X-API-Key: el
# proxy deja de ser un scraper publico para cualquiera que encuentre la URL.
API_KEY = os.environ.get("VUMIES_API_KEY")


def require_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="API key invalida")


router = APIRouter(dependencies=[Depends(require_api_key)])


@router.get("/api/recents")
def recents():
    try:
        return get_recents()
    except Exception as e:
        raise _upstream_error(e)


@router.get("/api/search")
def search(q: str = Query(..., min_length=1)):
    try:
        results = search_anime(q)
        return {"results": results, "total": len(results)}
    except Exception as e:
        raise _upstream_error(e)


@router.get("/api/catalog")
def catalog(
    page: int = Query(1, ge=1),
    genre: str = Query(""),
):
    try:
        return get_catalog(page, genre)
    except Exception as e:
        raise _upstream_error(e)


@router.get("/api/anime/info")
def anime_info(url: str = Query(...)):
    try:
        return get_anime_info(_safe_url(url))
    except HTTPException:
        raise
    except Exception as e:
        raise _upstream_error(e)


@router.get("/api/anime/franchise")
def franchise(slug: str = Query(..., description="Slug del anime, ej: naruto")):
    try:
        return get_franchise(slug)
    except Exception as e:
        raise _upstream_error(e)


@router.get("/api/episode")
def episode(url: str = Query(...)):
    try:
        return get_episode_links(_safe_url(url))
    except HTTPException:
        raise
    except Exception as e:
        raise _upstream_error(e)


@router.get("/api/schedule")
def schedule():
    try:
        return get_schedule()
    except Exception as e:
        raise _upstream_error(e)


app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
