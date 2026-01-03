import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    """Monthly budget limits per category."""
    
    __tablename__ = "budgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(50), nullable=False)
    monthly_limit = Column(Integer, nullable=False)  # In paise
    month = Column(Date, nullable=False)  # First day of the month
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Ensure one budget per category per month per user
    __table_args__ = (
        UniqueConstraint('user_id', 'category', 'month', name='unique_user_category_month'),
    )
    
    # Relationship
    user = relationship("User", back_populates="budgets")
    
    def __repr__(self):
        return f"<Budget {self.category}: {self.monthly_limit}>"
    
    @property
    def limit_display(self) -> float:
        """Return limit in rupees for display."""
        return self.monthly_limit / 100
