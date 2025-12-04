from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.error_handlers import register_error_handlers
from middleware.profanity import ProfanityFilterMiddleware

from routers import auth, users, health, patients, doctors, password_reset, sessions, medical_staff, hospitalizations, prescriptions, shifts, password_policy, appointments


app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "persistAuthorization": True
    }
)

app.add_middleware(ProfanityFilterMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Register error handlers
register_error_handlers(app)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(medical_staff.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(hospitalizations.router)
app.include_router(prescriptions.router)
app.include_router(shifts.router)
app.include_router(password_reset.router)
app.include_router(password_policy.router)
app.include_router(sessions.router)
