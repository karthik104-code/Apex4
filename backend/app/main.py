from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import router as api_v1_router
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Healthcare Companion REST API with document processing, AI assistant, and health analytics.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal service error occurred. Please try again or contact support if the issue persists.",
            "disclaimer": "This system is an AI assistive decision support tool and not a substitute for professional medical advice, diagnosis, or treatment.",
            "status": "error"
        }
    )

# Router Registrations
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root_healthcheck():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs",
        "safety_guardrails": "Enforced (Non-Diagnostic Assistive AI)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

