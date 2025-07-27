# BIPIN Backend (Flask + AI)

## Overview
This backend serves as the AI-powered engine for music recommendations, feedback collection, and admin data access. It is designed to work with the FRONTEND React app.

## Features
- Music recommendation API using hybrid ML (content + synthetic collaborative filtering)
- Feedback collection and (optional) model retraining
- Admin/test endpoints for full dataset access

## Endpoints
| Endpoint         | Method | Description                                 |
|------------------|--------|---------------------------------------------|
| /api/recommend   | POST   | Returns ranked song recommendations         |
| /api/songs       | GET    | Returns the full song dataset               |
| /api/feedback    | POST   | Accepts like/dislike feedback               |
| /api/retrain     | POST   | (Optional) Retrain model with new feedback  |

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the server:
   ```bash
   python app.py
   ```

## Data & Model
- Place your song dataset as `songs.csv` or `songs.pkl` in the BACKEND folder.
- Model and scaler files will be saved as `.pkl` after training.

## Architecture
- **Flask**: API framework
- **Pandas**: Data handling
- **scikit-learn / TensorFlow**: ML models
- **Joblib**: Model serialization
- **SQLite/JSON**: Feedback storage

## TODO
- Implement data preprocessing and model logic in `app.py`
- Add feedback storage and retraining logic 