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


EXPECTED_FRONTEND_INPUTS = [
    "OverallQual", "YearBuilt", "YearRemodAdd", "TotalBsmtSF", 
    "1stFlrSF", "2ndFlrSF", "GrLivArea", "FullBath", 
    "TotRmsAbvGrd", "GarageCars", "GarageArea"
]

@app.post("/predict")
def predict():
    data = request.get_json()
    if not data:
        logger.warning("Received empty or invalid JSON request body")
        return jsonify({"error": "Request body must be JSON"}), 400

    # 1. Validate the 11 frontend inputs
    missing_inputs = [f for f in EXPECTED_FRONTEND_INPUTS if f not in data]
    if missing_inputs:
        logger.warning(f"Request missing {len(missing_inputs)} inputs")
        return jsonify({
            "error": "Missing required input features",
            "missing_inputs": missing_inputs
        }), 400

    # Validate types
    for f in EXPECTED_FRONTEND_INPUTS:
        val = data[f]
        if not isinstance(val, (int, float)):
            logger.warning(f"Invalid type for {f}: {type(val)}")
            return jsonify({"error": f"Invalid type for {f}. Expected number."}), 400

    if not (1 <= data.get("OverallQual", 5) <= 10):
        return jsonify({"error": "OverallQual must be 1-10"}), 400

    # 2. Fill default 0 for all 87 features
    full_data = {f: 0 for f in features}

    # 2.1 Override strictly important features with reasonable values (instead of 0)
    # This prevents the model from penalizing predictions for having 0 lot area or 0 kitchens.
    REASONABLE_DEFAULTS = {
        "LotArea": 9000,        # Giá trị diện tích đất trung vị khá phổ biến
        "OverallCond": 5,       # Tình trạng trung bình (thang 1-10)
        "LotFrontage": 60,      # Mặt tiền trung bình
        "BedroomAbvGr": 3,      # Đa số nhà có 3 phòng ngủ
        "KitchenAbvGr": 1,      # Thường có 1 nhà bếp
        "MoSold": 6,            # Bán vào tháng 6 (mùa trao đổi nhà cao điểm)
        "YrSold": 2010          # Năm Dataset kết thúc
    }
    for f, val in REASONABLE_DEFAULTS.items():
        if f in full_data:
            full_data[f] = val

    # 3. Apply the 11 values from frontend
    for f in EXPECTED_FRONTEND_INPUTS:
        if f in full_data:  # Safe assignment, ensuring only features model knows
            full_data[f] = data[f]

    # 4. Feature Engineering (must match what model expects)
    yr_sold = REASONABLE_DEFAULTS["YrSold"]
    year_built = data.get('YearBuilt', 2000)
    year_remod = data.get('YearRemodAdd', year_built)

    if 'TotalSF' in full_data:
        full_data['TotalSF'] = data.get('TotalBsmtSF', 0) + data.get('1stFlrSF', 0) + data.get('2ndFlrSF', 0)
    if 'TotalBath' in full_data:
        full_data['TotalBath'] = data.get('FullBath', 0) 
    if 'HouseAge' in full_data:
        full_data['HouseAge'] = yr_sold - year_built
    if 'RemodelAge' in full_data:
        full_data['RemodelAge'] = yr_sold - year_remod
    if 'WasRemodeled' in full_data:
        full_data['WasRemodeled'] = 1 if (year_remod and year_built and year_remod != year_built) else 0
    if 'IsNew' in full_data:
        full_data['IsNew'] = 1 if (yr_sold - year_built) <= 1 else 0
    if 'HasGarage' in full_data:
        full_data['HasGarage'] = 1 if data.get('GarageArea', 0) > 0 else 0
    if 'HasBasement' in full_data:
        full_data['HasBasement'] = 1 if data.get('TotalBsmtSF', 0) > 0 else 0
    if 'HasPool' in full_data:
        full_data['HasPool'] = 0

    try:
        # 5. Extract DataFrame with exactly 87 columns in correct order
        df = pd.DataFrame([full_data])[features]

        # Check for NaNs (should not happen with default 0, but safe)
        if df.isnull().values.any():
            return jsonify({"error": "Unexpected null values in structured data"}), 500

        # Ensemble: 50% XGBoost + 50% LightGBM
        xgb_pred = xgb_model.predict(df)
        lgb_pred = lgb_model.predict(df)
        pred_log = 0.5 * xgb_pred + 0.5 * lgb_pred

        # Dataset uses log1p target — inverse transform
        price = float(np.expm1(pred_log[0]))
        xgb_price = float(np.expm1(xgb_pred[0]))
        lgb_price = float(np.expm1(lgb_pred[0]))

        logger.info(f"Prediction successful: ${price:,.2f}")

        # Output format (Đẹp)
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
