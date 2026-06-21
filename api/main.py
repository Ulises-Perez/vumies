from fastapi import FastAPI, Query, HTTPException
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

app = FastAPI(
    title="AnimeAV1 API",
    description="Scraping API para animeav1.com",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/recents")
def recents():
    try:
        return get_recents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search")
def search(q: str = Query(..., min_length=1)):
    try:
        results = search_anime(q)
        return {"results": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/catalog")
def catalog(
    page: int = Query(1, ge=1),
    genre: str = Query(""),
):
    try:
        return get_catalog(page, genre)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/anime/info")
def anime_info(url: str = Query(...)):
    try:
        return get_anime_info(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/anime/franchise")
def franchise(slug: str = Query(..., description="Slug del anime, ej: naruto")):
    try:
        return get_franchise(slug)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/episode")
def episode(url: str = Query(...)):
    try:
        return get_episode_links(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/schedule")
def schedule():
    try:
        return get_schedule()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
