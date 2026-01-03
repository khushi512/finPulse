from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Optional
from datetime import date
import csv
import io

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction, TRANSACTION_CATEGORIES
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
    CSVImportResponse
)
from app.services.auth import get_current_user
from app.services.ml_categorizer import predict_category_ml, get_model_stats, retrain_model

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    is_income: Optional[bool] = None,
    min_amount: Optional[int] = None,
    max_amount: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List transactions with filtering and pagination.
    
    - Filters: date range, category, income/expense, amount range, search
    - Search looks in description and merchant fields
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    # Apply filters
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    if is_income is not None:
        query = query.filter(Transaction.is_income == is_income)
    if min_amount:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount:
        query = query.filter(Transaction.amount <= max_amount)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_term),
                Transaction.merchant.ilike(search_term)
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    transactions = (
        query
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return TransactionListResponse(
        transactions=transactions,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/suggest-category")
async def suggest_transaction_category(
    description: str,
    merchant: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get ML-based category suggestions for a transaction.
    Uses Naive Bayes classifier with TF-IDF trained on user's history.
    """
    predictions = predict_category_ml(
        description=description,
        merchant=merchant,
        db=db,
        user_id=current_user.id
    )
    
    return {
        "suggestions": predictions,
        "best_match": predictions[0]["category"] if predictions else "Other"
    }


@router.get("/ml-stats")
async def get_ml_model_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about the ML model.
    Shows training status, number of transactions, vocabulary size, etc.
    """
    return get_model_stats(db, current_user.id)


@router.post("/retrain-model")
async def retrain_ml_model(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Force retrain the ML model with latest transaction data.
    Useful after importing new transactions or correcting categories.
    """
    success = retrain_model(db, current_user.id)
    return {
        "success": success,
        "message": "Model retrained successfully" if success else "Not enough data to train"
    }


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction."""
    transaction = Transaction(
        user_id=current_user.id,
        **transaction_data.model_dump()
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single transaction by ID."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: UUID,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Track if category was manually changed
    if 'category' in update_dict and update_dict['category'] != transaction.category:
        transaction.is_category_overridden = True
    
    for field, value in update_dict.items():
        setattr(transaction, field, value)
    
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    db.delete(transaction)
    db.commit()


@router.post("/import", response_model=CSVImportResponse)
async def import_transactions(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import transactions from a CSV file.
    
    Expected CSV columns:
    - date (YYYY-MM-DD format)
    - amount (in rupees, will be converted to paise)
    - description
    - category (optional, defaults to "Other")
    - is_income (optional, "true"/"false" or "1"/"0")
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    content = await file.read()
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')
    
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    skipped = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
        try:
            # Parse date
            date_str = row.get('date', '').strip()
            if not date_str:
                errors.append(f"Row {row_num}: Missing date")
                skipped += 1
                continue
            
            try:
                parsed_date = date.fromisoformat(date_str)
            except ValueError:
                errors.append(f"Row {row_num}: Invalid date format (use YYYY-MM-DD)")
                skipped += 1
                continue
            
            # Parse amount (convert rupees to paise)
            amount_str = row.get('amount', '').strip()
            if not amount_str:
                errors.append(f"Row {row_num}: Missing amount")
                skipped += 1
                continue
            
            try:
                amount_rupees = float(amount_str.replace(',', ''))
                amount_paise = int(amount_rupees * 100)
                if amount_paise <= 0:
                    raise ValueError("Amount must be positive")
            except ValueError as e:
                errors.append(f"Row {row_num}: Invalid amount - {str(e)}")
                skipped += 1
                continue
            
            # Get description
            description = row.get('description', '').strip()
            if not description:
                errors.append(f"Row {row_num}: Missing description")
                skipped += 1
                continue
            
            # Get category (optional)
            category = row.get('category', 'Other').strip()
            if category not in TRANSACTION_CATEGORIES:
                category = 'Other'
            
            # Get is_income (optional)
            is_income_str = row.get('is_income', 'false').strip().lower()
            is_income = is_income_str in ('true', '1', 'yes')
            
            # Get merchant (optional)
            merchant = row.get('merchant', '').strip() or None
            
            # Create transaction
            transaction = Transaction(
                user_id=current_user.id,
                date=parsed_date,
                amount=amount_paise,
                description=description,
                merchant=merchant,
                category=category,
                is_income=is_income
            )
            db.add(transaction)
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: Unexpected error - {str(e)}")
            skipped += 1
    
    db.commit()
    
    return CSVImportResponse(
        imported=imported,
        skipped=skipped,
        errors=errors[:10]  # Limit errors to first 10
    )
