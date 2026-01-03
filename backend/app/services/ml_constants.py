"""
Constants for ML prediction service.
Extracted magic numbers for better maintainability.
"""

# Minimum data requirements
MIN_TRANSACTIONS_FOR_PREDICTION = 2  # Minimum months of data for spending prediction
MIN_TRANSACTIONS_FOR_ANOMALY = 5     # Minimum transactions for anomaly detection
MIN_CATEGORY_TRANSACTIONS = 3        # Minimum transactions per category for prediction

# Time periods
DEFAULT_ANOMALY_DAYS = 90            # Default days to analyze for anomalies
MONTHLY_SPENDING_MONTHS = 6          # Months of history for spending prediction
CATEGORY_SPENDING_DAYS = 180         # Days for category-specific predictions

# Statistical thresholds
DEFAULT_Z_SCORE_THRESHOLD = 2.0      # Z-score threshold for anomaly detection
HIGH_SEVERITY_Z_SCORE = 3.0          # Z-score for high severity anomalies
CONFIDENCE_INTERVAL_MULTIPLIER = 1.96  # 95% confidence interval

# Confidence levels
HIGH_CONFIDENCE_THRESHOLD = 0.1      # Std dev < 10% of mean
MEDIUM_CONFIDENCE_THRESHOLD = 0.25   # Std dev < 25% of mean

# Budget alert thresholds
BUDGET_CRITICAL_THRESHOLD = 100      # Percentage for critical alert
BUDGET_WARNING_THRESHOLD = 90        # Percentage for warning alert
BUDGET_CAUTION_THRESHOLD = 75        # Percentage for caution alert

# Validation limits
MAX_ANOMALY_DAYS = 365               # Maximum days for anomaly detection
MIN_ANOMALY_DAYS = 1                 # Minimum days for anomaly detection
MAX_Z_SCORE_THRESHOLD = 5.0          # Maximum Z-score threshold
MIN_Z_SCORE_THRESHOLD = 1.0          # Minimum Z-score threshold
