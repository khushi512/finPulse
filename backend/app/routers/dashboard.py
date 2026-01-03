from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.services.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard summary including balance, income, expenses for current month.
    """
    today = date.today()
    first_of_month = today.replace(day=1)
    
    # Previous month for comparison
    if first_of_month.month == 1:
        first_of_prev_month = first_of_month.replace(year=first_of_month.year - 1, month=12)
    else:
        first_of_prev_month = first_of_month.replace(month=first_of_month.month - 1)
    last_of_prev_month = first_of_month - timedelta(days=1)
    
    # Current month income
    current_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= first_of_month,
        Transaction.is_income == True
    ).scalar() or 0
    
    # Current month expenses
    current_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= first_of_month,
        Transaction.is_income == False
    ).scalar() or 0
    
    # Previous month expenses for comparison
    prev_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= first_of_prev_month,
        Transaction.date <= last_of_prev_month,
        Transaction.is_income == False
    ).scalar() or 0
    
    # Total balance (all-time income - expenses)
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.is_income == True
    ).scalar() or 0
    
    total_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.is_income == False
    ).scalar() or 0
    
    balance = total_income - total_expenses
    
    # Calculate month-over-month change
    if prev_expenses > 0:
        expense_change = ((current_expenses - prev_expenses) / prev_expenses) * 100
    else:
        expense_change = 0
    
    # Category breakdown (all-time expenses by category)
    category_breakdown = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.is_income == False
    ).group_by(Transaction.category).all()
    
    categories = [
        {"category": cat, "amount": int(total)}
        for cat, total in category_breakdown
    ]
    
    # Recent transactions
    recent = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(5).all()
    
    return {
        "balance": int(balance),
        "monthly_income": int(current_income),
        "monthly_expenses": int(current_expenses),
        "expense_change_percent": round(expense_change, 1),
        "category_breakdown": categories,
        "recent_transactions": [
            {
                "id": str(t.id),
                "date": t.date.isoformat(),
                "amount": t.amount,
                "description": t.description,
                "merchant": t.merchant,
                "category": t.category,
                "is_income": t.is_income
            }
            for t in recent
        ]
    }
