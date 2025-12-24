import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.ai import router as ai_router
from app.api.admin import router as admin_router
from app.api.med import router as med_router
from app.api.patient import router as patient_router

app = FastAPI(title="Akademia Mysli API", version="0.1.0")

origins_env = os.getenv("CORS_ORIGINS")
if origins_env:
    allow_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(admin_router)
app.include_router(med_router)
app.include_router(patient_router)
