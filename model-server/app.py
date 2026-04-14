from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
import logging

# 1. Config Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 2. Config CORS
CORS(app)

# Load models on startup
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

logger.info(f"Loading models from {MODEL_DIR}...")
try:
    xgb_model  = joblib.load(os.path.join(MODEL_DIR, "xgboost_model.pkl"))
    lgb_model  = joblib.load(os.path.join(MODEL_DIR, "lightgbm_model.pkl"))
    features   = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
    logger.info(f"Successfully loaded models! Expected features count: {len(features)}")
except Exception as e:
    logger.error(f"Error loading models: {e}")
    raise e


@app.get("/health")
def health():
    return jsonify({"status": "UP", "model": "XGBoost + LightGBM ensemble"})


@app.post("/predict")
def predict():
    data = request.get_json()
    if not data:
        logger.warning("Received empty or invalid JSON request body")
        return jsonify({"error": "Request body must be JSON"}), 400

    # 3. Validate input
    missing_features = [f for f in features if f not in data]
    if missing_features:
        logger.warning(f"Request missing {len(missing_features)} features")
        return jsonify({
            "error": "Missing required features",
            "missing_count": len(missing_features),
            "missing_features": missing_features[:10] # Show up to 10 missing features
        }), 400

    # Validate correct data types and values
    for f in features:
        val = data[f]
        if not isinstance(val, (int, float)):
            logger.warning(f"Invalid type for feature '{f}': {type(val)}")
            return jsonify({"error": f"Invalid type for {f}. Expected number."}), 400

    try:
        df = pd.DataFrame([data])[features]

        # Check for NaNs
        if df.isnull().values.any():
            logger.warning("Request contains null/NaN values")
            return jsonify({"error": "Input data contains null values. Please provide valid numbers."}), 400

        # Ensemble: 50% XGBoost + 50% LightGBM
        xgb_pred = xgb_model.predict(df)
        lgb_pred = lgb_model.predict(df)
        pred_log = 0.5 * xgb_pred + 0.5 * lgb_pred

        # Dataset uses log1p target — inverse transform
        price = float(np.expm1(pred_log[0]))
        xgb_price = float(np.expm1(xgb_pred[0]))
        lgb_price = float(np.expm1(lgb_pred[0]))

        logger.info(f"Prediction successful: ${price:,.2f}")

        # 4. Output format (Đẹp)
        return jsonify({
            "success": True,
            "data": {
                "price": round(price, 2),
                "formatted_price": f"${price:,.0f}",
                "details": {
                    "xgboost_prediction": round(xgb_price, 2),
                    "lightgbm_prediction": round(lgb_price, 2),
                    "ensemble_weight": "50/50"
                }
            }
        })
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Prediction process failed", "details": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
