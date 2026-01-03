"""
Machine Learning-based transaction categorization using Naive Bayes with TF-IDF.
This is a proper ML implementation suitable for resume/portfolio projects.
"""
from typing import Dict, List, Optional, Tuple
from collections import defaultdict, Counter
from sqlalchemy.orm import Session
import math
import re

from app.models.transaction import Transaction, TRANSACTION_CATEGORIES


class NaiveBayesClassifier:
    """
    Multinomial Naive Bayes classifier with TF-IDF weighting.
    Learns from user's transaction history to predict categories.
    """
    
    def __init__(self):
        self.category_counts = defaultdict(int)
        self.word_counts = defaultdict(lambda: defaultdict(int))
        self.vocabulary = set()
        self.total_docs = 0
        self.doc_freq = defaultdict(int)  # Document frequency for IDF
        self.trained = False
        
    def _preprocess(self, text: str) -> List[str]:
        """Tokenize and normalize text."""
        # Convert to lowercase and remove special characters
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Tokenize
        words = text.split()
        # Remove very short words
        words = [w for w in words if len(w) > 2]
        return words
    
    def _calculate_tfidf(self, words: List[str]) -> Dict[str, float]:
        """Calculate TF-IDF scores for words."""
        # Term Frequency
        word_count = Counter(words)
        total_words = len(words)
        tf = {word: count / total_words for word, count in word_count.items()}
        
        # TF-IDF
        tfidf = {}
        for word, tf_score in tf.items():
            if word in self.doc_freq:
                # IDF = log(total_docs / doc_freq)
                idf = math.log((self.total_docs + 1) / (self.doc_freq[word] + 1))
                tfidf[word] = tf_score * idf
            else:
                tfidf[word] = tf_score
        
        return tfidf
    
    def train(self, documents: List[Tuple[str, str]]):
        """
        Train the classifier on labeled documents.
        documents: List of (text, category) tuples
        """
        # Reset
        self.category_counts = defaultdict(int)
        self.word_counts = defaultdict(lambda: defaultdict(int))
        self.vocabulary = set()
        self.doc_freq = defaultdict(int)
        self.total_docs = len(documents)
        
        # First pass: collect document frequencies
        for text, category in documents:
            words = self._preprocess(text)
            unique_words = set(words)
            for word in unique_words:
                self.doc_freq[word] += 1
        
        # Second pass: train the model
        for text, category in documents:
            words = self._preprocess(text)
            self.category_counts[category] += 1
            
            for word in words:
                self.word_counts[category][word] += 1
                self.vocabulary.add(word)
        
        self.trained = True
    
    def predict(self, text: str, top_n: int = 3) -> List[Tuple[str, float]]:
        """
        Predict category probabilities for given text.
        Returns list of (category, probability) tuples.
        """
        if not self.trained:
            return [("Other", 1.0)]
        
        words = self._preprocess(text)
        tfidf_scores = self._calculate_tfidf(words)
        
        # Calculate log probabilities for each category
        category_scores = {}
        vocab_size = len(self.vocabulary)
        
        for category in self.category_counts.keys():
            # Prior probability: P(category)
            prior = math.log(self.category_counts[category] / self.total_docs)
            
            # Likelihood: P(words|category) with Laplace smoothing
            likelihood = 0
            total_words_in_category = sum(self.word_counts[category].values())
            
            for word, tfidf in tfidf_scores.items():
                word_count = self.word_counts[category].get(word, 0)
                # Laplace smoothing
                word_prob = (word_count + 1) / (total_words_in_category + vocab_size)
                # Weight by TF-IDF
                likelihood += math.log(word_prob) * tfidf
            
            category_scores[category] = prior + likelihood
        
        # Convert log probabilities to probabilities
        max_score = max(category_scores.values())
        exp_scores = {cat: math.exp(score - max_score) for cat, score in category_scores.items()}
        total = sum(exp_scores.values())
        probabilities = {cat: score / total for cat, score in exp_scores.items()}
        
        # Sort by probability
        sorted_predictions = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_predictions[:top_n]
    
    def get_feature_importance(self, category: str, top_n: int = 10) -> List[Tuple[str, float]]:
        """Get most important words for a category (for explainability)."""
        if category not in self.word_counts:
            return []
        
        word_scores = []
        total_words = sum(self.word_counts[category].values())
        
        for word, count in self.word_counts[category].items():
            # Calculate relative frequency
            score = count / total_words
            word_scores.append((word, score))
        
        return sorted(word_scores, key=lambda x: x[1], reverse=True)[:top_n]


# Global classifier instance
_classifier = NaiveBayesClassifier()


def train_classifier(db: Session, user_id) -> bool:
    """
    Train the ML classifier on user's transaction history.
    Returns True if training was successful.
    """
    # Get user's transactions
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).all()
    
    if len(transactions) < 10:  # Need minimum data
        return False
    
    # Prepare training data
    documents = []
    for txn in transactions:
        text = f"{txn.description} {txn.merchant or ''}"
        documents.append((text, txn.category))
    
    # Train the model
    _classifier.train(documents)
    return True


def predict_category_ml(
    description: str,
    merchant: Optional[str] = None,
    db: Session = None,
    user_id = None
) -> List[Dict[str, any]]:
    """
    Predict category using ML model.
    Returns list of predictions with confidence scores.
    """
    # Train if not already trained
    if db and user_id and not _classifier.trained:
        train_classifier(db, user_id)
    
    if not _classifier.trained:
        # Fallback to rule-based if not enough data
        return [{"category": "Other", "confidence": 50.0, "method": "rule-based"}]
    
    # Predict
    text = f"{description} {merchant or ''}"
    predictions = _classifier.predict(text, top_n=3)
    
    # Format results
    results = []
    for category, probability in predictions:
        results.append({
            "category": category,
            "confidence": round(probability * 100, 1),
            "method": "ml"
        })
    
    return results


def get_model_stats(db: Session, user_id) -> Dict:
    """Get statistics about the ML model for the user."""
    if not _classifier.trained:
        train_classifier(db, user_id)
    
    if not _classifier.trained:
        return {
            "trained": False,
            "message": "Need at least 10 transactions to train the model"
        }
    
    return {
        "trained": True,
        "total_transactions": _classifier.total_docs,
        "vocabulary_size": len(_classifier.vocabulary),
        "categories": dict(_classifier.category_counts),
        "model_type": "Naive Bayes with TF-IDF"
    }


def retrain_model(db: Session, user_id) -> bool:
    """Force retrain the model with latest data."""
    return train_classifier(db, user_id)
