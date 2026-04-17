import { jest, describe, it, expect } from "@jest/globals";
import request from "supertest";

// ─── ESM Mock: phải gọi TRƯỚC dynamic import ────────────────────────────────
// jest.unstable_mockModule hoạt động với ESM khi gọi trước dynamic import
jest.unstable_mockModule("../src/services/prediction.service.js", () => ({
  predictPrice: jest.fn(),
  getHistory: jest.fn(),
}));

// ─── Dynamic import SAU khi mock đã được đăng ký ─────────────────────────────
const { default: app } = await import("../src/app.js");
const { predictPrice, getHistory } = await import(
  "../src/services/prediction.service.js"
);

// ─── Payload mẫu hợp lệ ─────────────────────────────────────────────────────
const validPayload = {
  OverallQual: 7,
  YearBuilt: 2003,
  YearRemodAdd: 2003,
  TotalBsmtSF: 856,
  "1stFlrSF": 856,
  "2ndFlrSF": 854,
  GrLivArea: 1710,
  FullBath: 2,
  TotRmsAbvGrd: 8,
  GarageCars: 2,
  GarageArea: 548,
};

const mockPredictionResult = {
  price: 208500,
  formatted_price: "$208,500",
  details: {
    xgboost_prediction: 207000,
    lightgbm_prediction: 210000,
    ensemble_weight: "50/50",
  },
  timestamp: new Date().toISOString(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("should return 200 with status UP", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("UP");
  });
});

describe("POST /api/v1/predict", () => {
  it("should return 200 with predicted price for valid payload", async () => {
    predictPrice.mockResolvedValueOnce(mockPredictionResult);

    const res = await request(app)
      .post("/api/v1/predict")
      .send(validPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("price");
    expect(res.body.price).toBe(208500);
    expect(predictPrice).toHaveBeenCalledTimes(1);
  });

  it("should return 400 when OverallQual is out of range (>10)", async () => {
    const res = await request(app)
      .post("/api/v1/predict")
      .send({ ...validPayload, OverallQual: 15 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation Failed");
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/v1/predict")
      .send({ OverallQual: 7 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation Failed");
  });

  it("should return 503 when model server is unavailable", async () => {
    predictPrice.mockRejectedValueOnce(
      new Error("Model server is currently unavailable. Please try again later.")
    );

    const res = await request(app)
      .post("/api/v1/predict")
      .send(validPayload);

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe("Model Server Unavailable");
  });
});

describe("GET /api/v1/history", () => {
  it("should return 200 with an array of history records", async () => {
    getHistory.mockResolvedValueOnce([
      { id: "abc123", predictedPrice: 208500, createdAt: new Date().toISOString() },
    ]);

    const res = await request(app).get("/api/v1/history");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("predictedPrice");
  });
});
