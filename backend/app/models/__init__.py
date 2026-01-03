# Models package - import all models so they're registered with SQLAlchemy
from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget

__all__ = ["User", "Transaction", "Budget"]
