"""
ML-based financial prediction service.
Provides spending forecasts, budget alerts, and anomaly detection.
"""
from typing import List, Dict, Optional
from datetime import date, datetime, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func
import statistics

from app.models.transaction import Transaction
from app.models.budget import Budget


def get_monthly_spending(db: Session, user_id, months: int = 6) -> Dict[str, float]:
    """Get monthly spending totals for the last N months."""
    today = date.today()
    start_date = today - timedelta(days=months * 30)
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.is_income == False
    ).all()
    
    monthly_totals = defaultdict(float)
    for txn in transactions:
        month_key = txn.date.strftime('%Y-%m')
        monthly_totals[month_key] += txn.amount / 100  # Convert to rupees
    
    return dict(monthly_totals)


def predict_next_month_spending(db: Session, user_id) -> Dict:
    """
    Predict next month's spending using moving average.
    Returns prediction with confidence interval.
    """
    monthly_spending = get_monthly_spending(db, user_id, months=6)
    
    if len(monthly_spending) < 2:
        return {
            "prediction": 0,
            "confidence": "low",
            "method": "insufficient_data",
            "message": "Need at least 2 months of data for predictions"
        }
    
    # Calculate moving average (last 3 months)
    recent_months = sorted(monthly_spending.items())[-3:]
    recent_values = [amount for _, amount in recent_months]
    
    prediction = sum(recent_values) / len(recent_values)
    
    # Calculate standard deviation for confidence
    if len(recent_values) > 1:
        std_dev = statistics.stdev(recent_values)
        confidence_interval = std_dev * 1.96  # 95% confidence
    else:
        std_dev = 0
        confidence_interval = 0
    
    # Determine confidence level
    if std_dev < prediction * 0.1:
        confidence = "high"
    elif std_dev < prediction * 0.25:
        confidence = "medium"
    else:
        confidence = "low"
    
    return {
        "prediction": round(prediction, 2),
        "lower_bound": round(max(0, prediction - confidence_interval), 2),
        "upper_bound": round(prediction + confidence_interval, 2),
        "confidence": confidence,
        "method": "moving_average",
        "based_on_months": len(recent_values),
        "historical_data": monthly_spending
    }


def predict_category_spending(db: Session, user_id, category: str) -> Dict:
    """Predict next month's spending for a specific category."""
    today = date.today()
    start_date = today - timedelta(days=180)  # 6 months
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.category == category,
        Transaction.date >= start_date,
        Transaction.is_income == False
    ).all()
    
    if len(transactions) < 3:
        return {
            "category": category,
            "prediction": 0,
            "confidence": "low",
            "message": "Insufficient data for this category"
        }
    
    # Group by month
    monthly_totals = defaultdict(float)
    for txn in transactions:
        month_key = txn.date.strftime('%Y-%m')
        monthly_totals[month_key] += txn.amount / 100
    
    # Calculate average
    values = list(monthly_totals.values())
    prediction = sum(values) / len(values)
    
    return {
        "category": category,
        "prediction": round(prediction, 2),
        "average_monthly": round(prediction, 2),
        "months_analyzed": len(monthly_totals)
    }


def get_budget_alerts(db: Session, user_id) -> List[Dict]:
    """
    Check budget status and predict when limits will be hit.
    Returns alerts for budgets at risk.
    """
    today = date.today()
    current_month = today.replace(day=1)
    days_in_month = (current_month.replace(month=current_month.month % 12 + 1, day=1) - timedelta(days=1)).day
    days_elapsed = today.day
    days_remaining = days_in_month - days_elapsed
    
    # Get budgets for current month
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == current_month
    ).all()
    
    if not budgets:
        return []
    
    # OPTIMIZED: Single query to get spending by category
    spending_by_category = dict(
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.category.in_([b.category for b in budgets]),
            Transaction.date >= current_month,
            Transaction.is_income == False
        ).group_by(Transaction.category).all()
    )
    
    alerts = []
    
    for budget in budgets:
        # Get spending from pre-fetched data
        spent = spending_by_category.get(budget.category, 0)
        
        spent_rupees = spent / 100
        limit_rupees = budget.monthly_limit / 100
        percentage_used = (spent_rupees / limit_rupees * 100) if limit_rupees > 0 else 0
        
        # Calculate daily burn rate
        daily_rate = spent_rupees / days_elapsed if days_elapsed > 0 else 0
        projected_total = daily_rate * days_in_month
        
        # Predict when budget will be exceeded
        remaining_budget = limit_rupees - spent_rupees
        if daily_rate > 0 and remaining_budget > 0:
            days_until_exceeded = remaining_budget / daily_rate
        else:
            days_until_exceeded = None
        
        # Create alert if at risk
        alert_level = None
        message = None
        
        if percentage_used >= 100:
            alert_level = "critical"
            message = f"Budget exceeded by ₹{abs(remaining_budget):.2f}"
        elif percentage_used >= 90:
            alert_level = "warning"
            message = f"Only ₹{remaining_budget:.2f} remaining ({days_remaining} days left)"
        elif days_until_exceeded and days_until_exceeded < days_remaining:
            alert_level = "caution"
            message = f"At current rate, budget will be exceeded in {int(days_until_exceeded)} days"
        elif percentage_used >= 75:
            alert_level = "info"
            message = f"₹{remaining_budget:.2f} remaining for {days_remaining} days"
        
        if alert_level:
            alerts.append({
                "category": budget.category,
                "alert_level": alert_level,
                "message": message,
                "spent": round(spent_rupees, 2),
                "limit": round(limit_rupees, 2),
                "percentage_used": round(percentage_used, 1),
                "daily_rate": round(daily_rate, 2),
                "projected_total": round(projected_total, 2),
                "days_remaining": days_remaining,
                "days_until_exceeded": int(days_until_exceeded) if days_until_exceeded else None
            })
    
    return sorted(alerts, key=lambda x: {"critical": 0, "warning": 1, "caution": 2, "info": 3}[x["alert_level"]])


def detect_anomalies(db: Session, user_id, days: int = 90, threshold: float = 2.0) -> List[Dict]:
    """
    Detect unusual transactions using Z-score method.
    Returns transactions that are statistical outliers.
    """
    today = date.today()
    start_date = today - timedelta(days=days)
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.is_income == False
    ).all()
    
    if len(transactions) < 5:
        return []
    
    # Calculate statistics
    amounts = [txn.amount / 100 for txn in transactions]
    mean_amount = statistics.mean(amounts)
    std_dev = statistics.stdev(amounts) if len(amounts) > 1 else 0
    
    if std_dev == 0:
        return []
    
    # Find outliers
    anomalies = []
    for txn in transactions:
        amount_rupees = txn.amount / 100
        z_score = abs((amount_rupees - mean_amount) / std_dev)
        
        if z_score > threshold:
            anomalies.append({
                "id": str(txn.id),
                "date": txn.date.isoformat(),
                "description": txn.description,
                "merchant": txn.merchant,
                "category": txn.category,
                "amount": round(amount_rupees, 2),
                "z_score": round(z_score, 2),
                "severity": "high" if z_score > 3 else "medium",
                "reason": f"Amount is {z_score:.1f}x standard deviations above average"
            })
    
    return sorted(anomalies, key=lambda x: x["z_score"], reverse=True)


def calculate_current_month_savings(db: Session, user_id) -> Dict:
    """Calculate savings rate for the current month."""
    today = date.today()
    start_date = date(today.year, today.month, 1)
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date
    ).all()
    
    income = sum(t.amount for t in transactions if t.is_income) / 100
    expense = sum(t.amount for t in transactions if not t.is_income) / 100
    
    if income == 0:
        return {"rate": 0, "status": "No Income"}
        
    savings = income - expense
    rate = (savings / income) * 100
    
    return {
        "rate": round(rate, 1),
        "savings": round(savings, 2),
        "income": round(income, 2),
        "expense": round(expense, 2)
    }


def get_spending_insights(db: Session, user_id) -> Dict:
    """
    Generate comprehensive spending insights.
    Combines predictions, alerts, anomalies, and savings rate.
    """
    return {
        "next_month_prediction": predict_next_month_spending(db, user_id),
        "budget_alerts": get_budget_alerts(db, user_id),
        "anomalies": detect_anomalies(db, user_id)[:5],  # Top 5 anomalies
        "savings_analysis": calculate_current_month_savings(db, user_id),
        "generated_at": datetime.utcnow().isoformat()
    }
