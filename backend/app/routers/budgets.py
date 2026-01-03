from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import date
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetStatusItem,
    BudgetStatusResponse
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("/status", response_model=BudgetStatusResponse)
async def get_budget_status(
    month: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get budget status for all categories for a given month.
    Shows budget limit, spent amount, and percentage used.
    """
    if month is None:
        month = date.today().replace(day=1)
    else:
        month = month.replace(day=1)
    
    # Get end of month
    if month.month == 12:
        next_month = month.replace(year=month.year + 1, month=1)
    else:
        next_month = month.replace(month=month.month + 1)
    
    # Get all budgets for this month
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month
    ).all()
    
    # Get spending per category for this month
    spending = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month,
        Transaction.date < next_month,
        Transaction.is_income == False
    ).group_by(Transaction.category).all()
    
    spending_dict = {cat: int(total) for cat, total in spending}
    
    # Build response
    budget_items = []
    total_budgeted = 0
    total_spent = 0
    
    for budget in budgets:
        spent = spending_dict.get(budget.category, 0)
        remaining = budget.monthly_limit - spent
        percentage = (spent / budget.monthly_limit * 100) if budget.monthly_limit > 0 else 0
        
        budget_items.append(BudgetStatusItem(
            category=budget.category,
            monthly_limit=budget.monthly_limit,
            spent=spent,
            remaining=remaining,
            percentage_used=round(percentage, 1),
            is_over_budget=spent > budget.monthly_limit
        ))
        
        total_budgeted += budget.monthly_limit
        total_spent += spent
    
    return BudgetStatusResponse(
        month=month,
        budgets=budget_items,
        total_budgeted=total_budgeted,
        total_spent=total_spent
    )


@router.get("", response_model=List[BudgetResponse])
async def list_budgets(
    month: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all budgets for a month."""
    if month is None:
        month = date.today().replace(day=1)
    else:
        month = month.replace(day=1)
    
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month
    ).all()
    
    return budgets


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new budget for a category."""
    # Check if budget already exists
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_data.category,
        Budget.month == budget_data.month.replace(day=1)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Budget for {budget_data.category} already exists for this month"
        )
    
    budget = Budget(
        user_id=current_user.id,
        category=budget_data.category,
        monthly_limit=budget_data.monthly_limit,
        month=budget_data.month.replace(day=1)
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: UUID,
    update_data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a budget's monthly limit."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    budget.monthly_limit = update_data.monthly_limit
    db.commit()
    db.refresh(budget)
    
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a budget."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    db.delete(budget)
    db.commit()
