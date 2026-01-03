# FinPulse Backend

Personal finance dashboard API with ML-powered transaction categorization.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables (copy .env.example to .env):
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

## API Documentation
Once running, visit http://localhost:8000/docs for interactive API documentation.
