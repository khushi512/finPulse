import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Boolean, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Transaction(Base):
    """Transaction model for income and expense tracking."""
    
    __tablename__ = "transactions"
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'date'),
        Index('idx_user_category', 'user_id', 'category'),
        Index('idx_user_date_income', 'user_id', 'date', 'is_income'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction details
    date = Column(Date, nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Stored in paise (smallest unit) to avoid float issues
    description = Column(Text, nullable=False)
    merchant = Column(String(255), nullable=True)  # Extracted or inferred merchant name
    category = Column(String(50), nullable=False, default="Other", index=True)
    is_income = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # ML categorization tracking
    category_confidence = Column(Integer, nullable=True)  # 0-100 confidence score
    is_category_overridden = Column(Boolean, default=False)  # User manually changed category
    
    # Relationship
    user = relationship("User", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction {self.amount} - {self.category}>"
    
    @property
    def amount_display(self) -> float:
        """Return amount in rupees for display."""
        return self.amount / 100


# Valid categories
TRANSACTION_CATEGORIES = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Travel",
    "Income",
    "Other"
]
