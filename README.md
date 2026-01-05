# FinPulse

A personal finance dashboard with AI-powered insights and ML-based transaction categorization.

## Features

- **Dashboard** - Overview of spending, income, and financial health
- **Transactions** - Track and manage transactions with automatic categorization
- **Budgets** - Set and monitor spending limits by category
- **AI Insights** - Smart predictions and anomaly detection
- **ML Categorization** - Naive Bayes classifier with TF-IDF for auto-categorizing transactions
- **Dark Mode** - Full dark/light theme support

## Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS
- React Router
- Recharts (data visualization)
- Axios

### Backend
- FastAPI (Python)
- PostgreSQL + SQLAlchemy
- JWT Authentication
- Scikit-learn (ML/predictions)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost/finpulse
# SECRET_KEY=your-secret-key
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30

# Run server
uvicorn app.main:app --reload
```

API documentation available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

App runs at: `http://localhost:5173`

## Project Structure

```
finPulse/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic and ML
│   │   ├── config.py      # Configuration
│   │   ├── database.py    # Database connection
│   │   └── main.py        # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API services
│   │   ├── context/       # React contexts
│   │   └── App.jsx
│   └── package.json
└── data/                  # Sample data
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/transactions` | GET | List transactions |
| `/transactions` | POST | Add transaction |
| `/transactions/import` | POST | Import CSV |
| `/budgets` | GET | List budgets |
| `/budgets` | POST | Create budget |
| `/dashboard/summary` | GET | Dashboard stats |
| `/predictions/insights` | GET | AI insights |

## ML Features

- **Auto-categorization**: Naive Bayes classifier trained on user transaction history with TF-IDF vectorization
- **Anomaly Detection**: Z-score based unusual spending detection
- **Spending Predictions**: Trend analysis for budget forecasting
