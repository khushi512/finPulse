from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List, Literal

from app.models.transaction import TRANSACTION_CATEGORIES


class TransactionBase(BaseModel):
    """Base transaction schema."""
    date: date
    amount: int = Field(..., gt=0, description="Amount in paise (e.g., 10000 = ₹100)")
    description: str = Field(..., min_length=1, max_length=500)
    merchant: Optional[str] = Field(None, max_length=255)
    category: str = "Other"
    is_income: bool = False
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v not in TRANSACTION_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TRANSACTION_CATEGORIES)}")
        return v


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction."""
    pass


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction (all fields optional)."""
    date: Optional[date] = None
    amount: Optional[int] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    merchant: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = None
    is_income: Optional[bool] = None
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v is not None and v not in TRANSACTION_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TRANSACTION_CATEGORIES)}")
        return v


class TransactionResponse(TransactionBase):
    """Schema for transaction response."""
    id: UUID
    user_id: UUID
    category_confidence: Optional[int] = None
    is_category_overridden: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""
    transactions: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TransactionFilters(BaseModel):
    """Query parameters for filtering transactions."""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    is_income: Optional[bool] = None
    min_amount: Optional[int] = None
    max_amount: Optional[int] = None
    search: Optional[str] = None  # Search in description/merchant


class CSVImportResponse(BaseModel):
    """Response for CSV import."""
    imported: int
    skipped: int
    errors: List[str]
