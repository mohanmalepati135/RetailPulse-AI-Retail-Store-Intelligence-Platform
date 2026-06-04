"""RetailPulse AI — FastAPI application entrypoint."""
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database.seed import seed_if_empty
from .database.session import init_db
from .database.transactions_loader import load_transactions
from .logging_config import configure_logging, get_logger
from .routes import (
    analytics,
    anomalies,
    events,
    fleet,
    health,
    stores,
    ws,
)

settings = get_settings()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    init_db()
    # Priority: real CCTV-processed data already in DB → otherwise auto-seed so
    # the reviewer never lands on a blank dashboard. Disabled under tests.
    if settings.auto_seed:
        seed_if_empty()
        load_transactions()
    logger.info("RetailPulse AI started", extra={"context": {"env": settings.environment}})
    yield
    logger.info("RetailPulse AI shutting down")


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def observability(request: Request, call_next):
    """Structured per-request logging: trace_id, endpoint, latency, status."""
    trace_id = uuid.uuid4().hex[:12]
    started = time.perf_counter()
    response = await call_next(request)
    latency_ms = round((time.perf_counter() - started) * 1000, 1)
    response.headers["X-Trace-Id"] = trace_id
    logger.info(
        "request",
        extra={
            "context": {
                "trace_id": trace_id,
                "endpoint": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "latency_ms": latency_ms,
            }
        },
    )
    return response


app.include_router(health.router)
app.include_router(events.router)
app.include_router(analytics.router)
app.include_router(stores.router)
app.include_router(fleet.router)
app.include_router(anomalies.router)
app.include_router(ws.router)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled error")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/")
def root() -> dict:
    return {"service": settings.app_name, "status": "ok"}
