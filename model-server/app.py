from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
import os

app = Flask(__name__)

# Load models on startup
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

xgb_model  = joblib.load(os.path.join(MODEL_DIR, "xgboost_model.pkl"))
lgb_model  = joblib.load(os.path.join(MODEL_DIR, "lightgbm_model.pkl"))
features   = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))


@app.get("/health")
def health():
    return jsonify({"status": "UP", "model": "XGBoost + LightGBM ensemble"})


@app.post("/predict")
def predict():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    try:
        df = pd.DataFrame([data])[features]
    except KeyError as e:
        return jsonify({"error": f"Missing feature: {e}"}), 400

    try:
        # Ensemble: 50% XGBoost + 50% LightGBM
        xgb_pred = xgb_model.predict(df)
        lgb_pred = lgb_model.predict(df)
        pred_log = 0.5 * xgb_pred + 0.5 * lgb_pred

        # Dataset uses log1p target — inverse transform
        price = float(np.expm1(pred_log[0]))
        return jsonify({"price": price})
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
