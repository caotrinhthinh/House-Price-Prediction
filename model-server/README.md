# 🐍 Python Model Server

Flask server wrapping XGBoost + LightGBM ensemble for house price prediction.

## Run locally

```bash
pip install -r requirements.txt

# Place your .pkl files here, then:
python app.py
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/predict` | Predict house price |

## POST /predict — Request body

```json
{
  "MedInc":    5.0,
  "HouseAge":  10.0,
  "AveRooms":  6.0,
  "AveBedrms": 1.0,
  "Population":1500.0,
  "AveOccup":  3.0,
  "Latitude":  37.0,
  "Longitude": -122.0
}
```

## Deploy to HuggingFace Spaces

1. Create a new **Docker Space** on huggingface.co
2. Push this folder (include your `.pkl` files)
3. HuggingFace auto-builds and serves the container
