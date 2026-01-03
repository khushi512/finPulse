from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List

from app.models.transaction import TRANSACTION_CATEGORIES


class BudgetBase(BaseModel):
    """Base budget schema."""
    category: str
    monthly_limit: int = Field(..., gt=0, description="Budget limit in paise")
    month: date = Field(..., description="First day of the month")
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v not in TRANSACTION_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TRANSACTION_CATEGORIES)}")
        return v
    
    @field_validator('month')
    @classmethod
    def validate_month(cls, v):
        # Ensure it's the first day of the month
        if v.day != 1:
            return v.replace(day=1)
        return v


class BudgetCreate(BudgetBase):
    """Schema for creating a budget."""
    pass


class BudgetUpdate(BaseModel):
    """Schema for updating a budget."""
    monthly_limit: int = Field(..., gt=0)


class BudgetResponse(BudgetBase):
    """Schema for budget response."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BudgetStatusItem(BaseModel):
    """Budget status for a single category."""
    category: str
    monthly_limit: int
    spent: int
    remaining: int
    percentage_used: float
    is_over_budget: bool


class BudgetStatusResponse(BaseModel):
    """Budget status for all categories in a month."""
    month: date
    budgets: List[BudgetStatusItem]
    total_budgeted: int
    total_spent: int
