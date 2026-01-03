"""
Auto-categorization service for transactions.
Uses keyword matching with a learning database.
"""
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter

from app.models.transaction import Transaction, TRANSACTION_CATEGORIES


# Default keyword mappings for each category
DEFAULT_KEYWORDS = {
    "Food & Dining": [
        "swiggy", "zomato", "restaurant", "cafe", "coffee", "pizza", "burger", 
        "food", "dining", "eat", "lunch", "dinner", "breakfast", "dominos", 
        "mcdonalds", "kfc", "starbucks", "dunkin", "subway", "uber eats",
        "doordash", "grubhub", "kitchen", "bakery", "biryani", "chai", "tea"
    ],
    "Transport": [
        "uber", "ola", "lyft", "taxi", "cab", "auto", "rickshaw", "metro",
        "bus", "train", "rapido", "petrol", "diesel", "fuel", "gas", "parking",
        "toll", "highway", "bike", "scooter", "rental", "car"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "snapdeal", "mall", "shop",
        "store", "retail", "clothing", "fashion", "shoes", "electronics",
        "gadget", "appliance", "furniture", "ikea", "walmart", "target",
        "bigbasket", "grofers", "blinkit", "zepto", "instamart"
    ],
    "Entertainment": [
        "netflix", "spotify", "amazon prime", "hotstar", "disney", "movie",
        "cinema", "pvr", "inox", "theatre", "concert", "game", "gaming",
        "playstation", "xbox", "steam", "music", "show", "event", "ticket"
    ],
    "Bills & Utilities": [
        "electricity", "water", "gas", "internet", "wifi", "broadband",
        "mobile", "phone", "recharge", "bill", "utility", "airtel", "jio",
        "vodafone", "bsnl", "act fibernet", "maintenance", "society"
    ],
    "Healthcare": [
        "hospital", "doctor", "clinic", "pharmacy", "medicine", "medical",
        "health", "apollo", "medplus", "netmeds", "1mg", "pharmeasy",
        "diagnostic", "lab", "test", "dental", "eye", "therapy"
    ],
    "Travel": [
        "flight", "airline", "airport", "hotel", "booking", "makemytrip",
        "goibibo", "cleartrip", "yatra", "airbnb", "oyo", "travel",
        "vacation", "trip", "tour", "indigo", "spicejet", "vistara"
    ],
    "Education": [
        "course", "class", "school", "college", "university", "tuition",
        "udemy", "coursera", "skillshare", "book", "library", "education",
        "learning", "training", "exam", "test", "certification"
    ],
    "Income": [
        "salary", "payroll", "freelance", "payment received", "refund",
        "cashback", "dividend", "interest", "bonus", "commission", "income",
        "credit", "received from", "sent by"
    ],
    "Investment": [
        "mutual fund", "stock", "share", "sip", "investment", "trading",
        "zerodha", "groww", "upstox", "paytm money", "smallcase", "gold",
        "crypto", "bitcoin", "nft", "fd", "fixed deposit", "ppf", "nps"
    ],
}


def suggest_category(
    description: str,
    merchant: Optional[str] = None,
    db: Session = None,
    user_id = None
) -> str:
    """
    Suggest a category based on description and merchant.
    Uses keyword matching and user's historical patterns.
    """
    # Combine description and merchant for matching
    text = f"{description} {merchant or ''}".lower()
    
    # First, check user's historical patterns if available
    if db and user_id:
        learned_category = _get_learned_category(db, user_id, text)
        if learned_category:
            return learned_category
    
    # Fall back to keyword matching
    scores: Dict[str, int] = Counter()
    
    for category, keywords in DEFAULT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                # Longer keywords get higher weight
                scores[category] += len(keyword)
    
    if scores:
        return scores.most_common(1)[0][0]
    
    return "Other"


def _get_learned_category(db: Session, user_id, text: str) -> Optional[str]:
    """
    Check if user has previously categorized similar transactions.
    Uses a simple text similarity approach.
    """
    # Get user's past transactions with similar descriptions
    words = set(text.split())
    if len(words) < 2:
        return None
    
    # Query recent transactions with matching words
    recent_txns = db.query(
        Transaction.description,
        Transaction.merchant,
        Transaction.category
    ).filter(
        Transaction.user_id == user_id
    ).order_by(
        Transaction.created_at.desc()
    ).limit(100).all()
    
    # Find best matching transaction
    best_match = None
    best_score = 0
    
    for txn in recent_txns:
        txn_text = f"{txn.description} {txn.merchant or ''}".lower()
        txn_words = set(txn_text.split())
        
        # Calculate Jaccard similarity
        intersection = len(words & txn_words)
        union = len(words | txn_words)
        
        if union > 0:
            similarity = intersection / union
            if similarity > best_score and similarity > 0.5:
                best_score = similarity
                best_match = txn.category
    
    return best_match


def get_category_suggestions(
    text: str,
    db: Session = None,
    user_id = None,
    top_n: int = 3
) -> List[Dict[str, any]]:
    """
    Get multiple category suggestions with confidence scores.
    """
    text = text.lower()
    scores: Dict[str, float] = Counter()
    
    # Keyword matching
    for category, keywords in DEFAULT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                scores[category] += len(keyword) * 2
    
    # Add learned patterns if available
    if db and user_id:
        learned = _get_learned_category(db, user_id, text)
        if learned:
            scores[learned] += 50  # High bonus for learned pattern
    
    # Normalize scores
    total = sum(scores.values()) or 1
    suggestions = []
    
    for category, score in scores.most_common(top_n):
        confidence = min(score / total * 100, 95)
        suggestions.append({
            "category": category,
            "confidence": round(confidence, 1)
        })
    
    # If no matches, return "Other"
    if not suggestions:
        suggestions = [{"category": "Other", "confidence": 50.0}]
    
    return suggestions


def train_from_correction(
    db: Session,
    user_id,
    description: str,
    merchant: Optional[str],
    correct_category: str
) -> None:
    """
    Learn from user corrections by storing the pattern.
    The transaction itself serves as the learning data.
    """
    # The system learns automatically from stored transactions
    # No additional training needed - just save the transaction
    pass
