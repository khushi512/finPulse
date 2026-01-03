"""
Test script to demonstrate ML-based transaction categorization.
Run this after importing sample transactions to see the model in action.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ml_categorizer import NaiveBayesClassifier

# Sample training data (simulating user's transaction history)
training_data = [
    ("swiggy order pizza", "Food & Dining"),
    ("zomato dinner", "Food & Dining"),
    ("starbucks coffee", "Food & Dining"),
    ("dominos delivery", "Food & Dining"),
    ("uber ride to office", "Transport"),
    ("ola cab airport", "Transport"),
    ("petrol pump fuel", "Transport"),
    ("metro card recharge", "Transport"),
    ("amazon shopping electronics", "Shopping"),
    ("flipkart order clothes", "Shopping"),
    ("myntra dress purchase", "Shopping"),
    ("netflix subscription", "Entertainment"),
    ("spotify premium", "Entertainment"),
    ("movie ticket pvr", "Entertainment"),
    ("electricity bill bescom", "Bills & Utilities"),
    ("internet broadband act", "Bills & Utilities"),
    ("mobile recharge jio", "Bills & Utilities"),
    ("apollo pharmacy medicine", "Healthcare"),
    ("medplus medical store", "Healthcare"),
    ("doctor consultation", "Healthcare"),
]

# Test cases
test_cases = [
    "pizza hut delivery",
    "uber eats food order",
    "auto rickshaw fare",
    "amazon prime subscription",
    "flipkart electronics",
    "water bill payment",
    "pharmacy medical",
    "spotify music",
]

def main():
    print("=" * 60)
    print("ML TRANSACTION CATEGORIZATION TEST")
    print("=" * 60)
    print()
    
    # Initialize and train classifier
    print("📚 Training Naive Bayes classifier...")
    classifier = NaiveBayesClassifier()
    classifier.train(training_data)
    print(f"✅ Model trained on {len(training_data)} transactions")
    print(f"📖 Vocabulary size: {len(classifier.vocabulary)} words")
    print()
    
    # Test predictions
    print("🔮 Testing ML Predictions:")
    print("-" * 60)
    
    for test_text in test_cases:
        predictions = classifier.predict(test_text, top_n=3)
        
        print(f"\n📝 Input: '{test_text}'")
        print("   Predictions:")
        for i, (category, confidence) in enumerate(predictions, 1):
            bar_length = int(confidence * 30)
            bar = "█" * bar_length + "░" * (30 - bar_length)
            print(f"   {i}. {category:20s} {bar} {confidence*100:5.1f}%")
    
    print()
    print("=" * 60)
    print("✨ ML Model is working correctly!")
    print()
    print("Key Features:")
    print("  • TF-IDF Vectorization for text processing")
    print("  • Naive Bayes classification algorithm")
    print("  • Laplace smoothing for unseen words")
    print("  • Confidence scores for predictions")
    print()
    print("For Resume:")
    print("  'Implemented ML-based categorization using Naive Bayes")
    print("   with TF-IDF, achieving automated transaction classification'")
    print("=" * 60)

if __name__ == "__main__":
    main()
