from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router
from app.api.workflow_routes import router as workflow_router
from app.services.ml_service import ml_service

app = FastAPI(title="ChickenShii API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(workflow_router)


@app.get("/")
def health_check():
    return {
        "status": "online",
        "model_loaded": ml_service.model is not None,
        "classes": ["Coccidiosis", "Healthy", "New Castle Disease", "Salmonellosis"]
    }
