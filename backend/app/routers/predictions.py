from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.ml_predictor import (
    predict_next_month_spending,
    predict_category_spending,
    get_budget_alerts,
    detect_anomalies,
    get_spending_insights
)
from app.services.ml_constants import (
    DEFAULT_ANOMALY_DAYS,
    DEFAULT_Z_SCORE_THRESHOLD,
    MAX_ANOMALY_DAYS,
    MIN_ANOMALY_DAYS,
    MAX_Z_SCORE_THRESHOLD,
    MIN_Z_SCORE_THRESHOLD
)

router = APIRouter(prefix="/predictions", tags=["Predictions"])


# Pydantic models for input validation
class AnomalyParams(BaseModel):
    """Parameters for anomaly detection with validation."""
    days: int = Field(
        default=DEFAULT_ANOMALY_DAYS,
        ge=MIN_ANOMALY_DAYS,
        le=MAX_ANOMALY_DAYS,
        description="Number of days to analyze"
    )
    threshold: float = Field(
        default=DEFAULT_Z_SCORE_THRESHOLD,
        ge=MIN_Z_SCORE_THRESHOLD,
        le=MAX_Z_SCORE_THRESHOLD,
        description="Z-score threshold for anomalies"
    )


@router.get("/spending")
async def get_spending_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get next month's spending prediction using ML.
    Uses moving average of last 3 months.
    """
    try:
        return predict_next_month_spending(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/category/{category}")
async def get_category_prediction(
    category: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get spending prediction for a specific category.
    """
    try:
        return predict_category_spending(db, current_user.id, category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category prediction failed: {str(e)}")


@router.get("/budget-alerts")
async def get_budget_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get budget alerts and predictions for when limits will be exceeded.
    Returns alerts sorted by severity.
    """
    try:
        alerts = get_budget_alerts(db, current_user.id)
        return {
            "alerts": alerts,
            "total_alerts": len(alerts),
            "critical_count": sum(1 for a in alerts if a["alert_level"] == "critical"),
            "warning_count": sum(1 for a in alerts if a["alert_level"] == "warning")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget alerts failed: {str(e)}")


@router.get("/anomalies")
async def get_anomalous_transactions(
    days: int = DEFAULT_ANOMALY_DAYS,
    threshold: float = DEFAULT_Z_SCORE_THRESHOLD,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Detect unusual transactions using statistical anomaly detection.
    
    - days: Number of days to analyze (1-365, default: 90)
    - threshold: Z-score threshold for anomalies (1.0-5.0, default: 2.0)
    """
    # Validate parameters
    params = AnomalyParams(days=days, threshold=threshold)
    
    try:
        anomalies = detect_anomalies(db, current_user.id, params.days, params.threshold)
        return {
            "anomalies": anomalies,
            "total_found": len(anomalies),
            "analysis_period_days": params.days,
            "threshold": params.threshold
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.get("/insights")
async def get_all_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive spending insights including:
    - Next month prediction
    - Budget alerts
    - Anomalous transactions
    """
    try:
        return get_spending_insights(db, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")
