from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, transactions, dashboard, budgets, predictions

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="FinPulse API",
    description="Personal Finance Dashboard with ML-powered categorization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for now to make deployment easier, or config via env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")


@app.on_event("startup")
async def startup():
    """Create database tables on startup."""
    # Import all models to register them with Base
    from app.models import User, Transaction, Budget  # noqa: F401
    Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "name": "FinPulse API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
