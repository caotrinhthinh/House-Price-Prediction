import pytest
import joblib
import numpy as np
from unittest.mock import MagicMock, patch
import sys
import os

# ─── Mock PKL files trước khi import app để CI không cần file .pkl thật ─────
# Tạo mock models với predict() method để unittest chạy được mà không cần file model
@pytest.fixture(scope="session", autouse=True)
def mock_models():
    """Mock joblib.load để trả về fake models, tránh cần file .pkl thật trong CI."""
    mock_xgb = MagicMock()
    mock_xgb.predict.return_value = np.array([12.25])  # log(price) ~ $208,500

    mock_lgb = MagicMock()
    mock_lgb.predict.return_value = np.array([12.25])

    mock_features = [f"feature_{i}" for i in range(88)]

    with patch("joblib.load", side_effect=[mock_xgb, mock_lgb, mock_features]):
        import app as flask_app
        flask_app.xgb_model = mock_xgb
        flask_app.lgb_model = mock_lgb
        flask_app.features = mock_features
        yield flask_app


@pytest.fixture
def client(mock_models):
    mock_models.app.config["TESTING"] = True
    with mock_models.app.test_client() as client:
        yield client


# ─── Payload mẫu hợp lệ ─────────────────────────────────────────────────────
VALID_PAYLOAD = {
    "OverallQual": 7,
    "YearBuilt": 2003,
    "YearRemodAdd": 2003,
    "TotalBsmtSF": 856,
    "1stFlrSF": 856,
    "2ndFlrSF": 854,
    "GrLivArea": 1710,
    "FullBath": 2,
    "TotRmsAbvGrd": 8,
    "GarageCars": 2,
    "GarageArea": 548,
}


# ─── Test Suite ───────────────────────────────────────────────────────────────

class TestHealthCheck:
    def test_health_returns_200(self, client):
        res = client.get("/health")
        assert res.status_code == 200

    def test_health_status_is_up(self, client):
        res = client.get("/health")
        data = res.get_json()
        assert data["status"] == "UP"


class TestPredictEndpoint:
    def test_predict_valid_payload_returns_200(self, client):
        res = client.post("/predict", json=VALID_PAYLOAD)
        assert res.status_code == 200

    def test_predict_response_has_price(self, client):
        res = client.post("/predict", json=VALID_PAYLOAD)
        data = res.get_json()
        assert data["success"] is True
        assert "price" in data["data"]
        assert data["data"]["price"] > 0

    def test_predict_overallqual_out_of_range_returns_400(self, client):
        payload = {**VALID_PAYLOAD, "OverallQual": 15}
        res = client.post("/predict", json=payload)
        assert res.status_code == 400

    def test_predict_missing_fields_returns_400(self, client):
        res = client.post("/predict", json={"OverallQual": 7})
        assert res.status_code == 400

    def test_predict_string_value_returns_400(self, client):
        payload = {**VALID_PAYLOAD, "GrLivArea": "not-a-number"}
        res = client.post("/predict", json=payload)
        assert res.status_code == 400

    def test_predict_no_body_returns_400(self, client):
        res = client.post("/predict")
        assert res.status_code == 400
