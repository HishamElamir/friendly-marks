from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import annotations, auth, devices, documents, progress, search

settings = get_settings()

app = FastAPI(title="Friendly Marks API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(documents.router)
app.include_router(annotations.router)
app.include_router(progress.router)
app.include_router(search.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
