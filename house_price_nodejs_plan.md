# 🏠 House Price Prediction — Node.js + React Plan

> **Stack:** Express.js (Node.js) · Python (Train) · React + Vite (Frontend) · PostgreSQL · Prisma ORM · Docker  
> **Thời gian:** 7 ngày · **Chi phí:** $0 (toàn bộ free tier)

---

## 📐 Kiến trúc Tổng thể

```
┌──────────────────────────────────────────────────────┐
│            Frontend (React 18 + Vite)                 │
│         Vercel — vercel.com (Free)                    │
└───────────────────────┬──────────────────────────────┘
                        │ HTTP/REST (Axios)
┌───────────────────────▼──────────────────────────────┐
│           Node.js + Express.js                        │
│         Railway / Render (Free tier)                  │
│                                                       │
│  Route → Controller → Service → Prisma ORM            │
│  + Zod Validation     + node-cache (Cache)            │
│  + express-rate-limit + opossum (Circuit Breaker)     │
│  + Winston Logger     + Prisma Migrate                │
└───────────────────────────────────────────────────────┘
                        │ HTTP
         ┌──────────────▼─────────────┐
         │   Python Model Server       │
         │   (Flask + XGBoost)         │
         │   HuggingFace Spaces (Free) │
         └─────────────────────────────┘
```

---

## 📁 Cấu trúc Project

```
house-price-predictor/
│
├── 📓 notebook/
│   └── train_model.ipynb              # Google Colab — train XGBoost
│
├── 🐍 model-server/                   # Python wrap model thành REST
│   ├── app.py
│   ├── xgboost_model.pkl
│   ├── lightgbm_model.pkl
│   ├── feature_names.pkl
│   └── requirements.txt
│
├── ☕ backend/                         # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   └── prediction.routes.js
│   │   ├── controllers/
│   │   │   └── prediction.controller.js
│   │   ├── services/
│   │   │   ├── prediction.service.js
│   │   │   └── modelClient.service.js
│   │   ├── middleware/
│   │   │   ├── validate.middleware.js     # Zod validation
│   │   │   ├── rateLimit.middleware.js    # express-rate-limit
│   │   │   └── errorHandler.middleware.js # Global error handler
│   │   ├── schemas/
│   │   │   └── prediction.schema.js      # Zod schemas
│   │   ├── config/
│   │   │   ├── db.js                     # Prisma client
│   │   │   ├── cache.js                  # node-cache setup
│   │   │   └── circuitBreaker.js         # opossum setup
│   │   ├── utils/
│   │   │   └── logger.js                 # Winston logger
│   │   └── app.js                        # Express app entrypoint
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   │   ├── unit/
│   │   │   └── prediction.service.test.js
│   │   └── integration/
│   │       └── prediction.api.test.js
│   ├── .env
│   ├── package.json
│   └── Dockerfile
│
├── 🌐 frontend/                        # React 18 + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── PredictionForm.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   └── HistoryChart.jsx
│   │   ├── hooks/
│   │   │   └── usePrediction.js        # Custom hook (React Query)
│   │   ├── api/
│   │   │   └── predictionApi.js        # Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
│
└── 🐳 docker-compose.yml
```

---

## 📅 Roadmap 7 Ngày

### **Ngày 1 — Train Model (Python/Colab)**

**Mục tiêu:** Có file `xgboost_model.pkl` để dùng trong backend

```
[ ] Tạo tài khoản Kaggle → tải dataset California Housing
[ ] Chạy notebook: EDA → Preprocess → XGBoost + LightGBM → Ensemble
[ ] Đánh giá: RMSE < 0.15 (log scale), R² > 0.88
[ ] Export: xgboost_model.pkl, lightgbm_model.pkl, feature_names.pkl
[ ] Upload lên HuggingFace Hub
```

---

### **Ngày 2 — Python Model Server**

```python
# model-server/app.py
from flask import Flask, request, jsonify
import joblib, numpy as np, pandas as pd

app = Flask(__name__)
xgb   = joblib.load("xgboost_model.pkl")
lgb   = joblib.load("lightgbm_model.pkl")
feats = joblib.load("feature_names.pkl")

@app.post("/predict")
def predict():
    df = pd.DataFrame([request.json])[feats]
    p  = 0.5 * xgb.predict(df) + 0.5 * lgb.predict(df)
    return jsonify({"price": float(np.expm1(p[0]))})
```

```
[ ] Viết Flask app.py
[ ] Test local: curl -X POST localhost:5000/predict -d '{...}'
[ ] Deploy lên HuggingFace Spaces
[ ] Ghi lại URL: https://your-name-model-server.hf.space
```

---

### **Ngày 3–4 — Node.js Backend**

#### 3.1 package.json — Dependencies

```json
{
  "dependencies": {
    "express": "^4.19.2",
    "axios": "^1.7.2",
    "@prisma/client": "^5.15.0",
    "zod": "^3.23.8",
    "node-cache": "^5.1.2",
    "opossum": "^8.1.1",
    "express-rate-limit": "^7.3.1",
    "winston": "^3.13.0",
    "morgan": "^1.10.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.4.5",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "prisma": "^5.15.0",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "nodemon": "^3.1.4"
  }
}
```

---

#### 3.2 Prisma Schema + Migration

> ✅ **Prisma** thay thế raw SQL — type-safe ORM, auto-generate migration

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model PredictionHistory {
  id             Int      @id @default(autoincrement())
  medInc         Float
  houseAge       Float
  aveRooms       Float
  aveBedrms      Float
  population     Float
  aveOccup       Float
  latitude       Float
  longitude      Float
  predictedPrice Float
  priceRangeLow  Float
  priceRangeHigh Float
  createdAt      DateTime @default(now())

  @@index([createdAt(sort: Desc)])
  @@map("prediction_history")
}
```

```bash
# Chạy migration lần đầu
npx prisma migrate dev --name init_prediction_history

# Generate Prisma Client
npx prisma generate
```

---

#### 3.3 .env

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/house_price_db
MODEL_SERVER_URL=https://your-name-model-server.hf.space
NODE_ENV=development
```

---

#### 3.4 Zod Validation — Schema

> ✅ **Zod** — runtime type validation, tự động infer TypeScript types và trả lỗi có cấu trúc

```js
// src/schemas/prediction.schema.js
import { z } from "zod";

export const predictionSchema = z.object({
  medInc:     z.number().positive({ message: "medInc must be positive" }),
  houseAge:   z.number().positive({ message: "houseAge must be positive" }),
  aveRooms:   z.number().positive({ message: "aveRooms must be positive" }),
  aveBedrms:  z.number().positive({ message: "aveBedrms must be positive" }),
  population: z.number().positive({ message: "population must be positive" }),
  aveOccup:   z.number().min(1,  { message: "aveOccup must be at least 1" }),
  latitude:   z.number().min(-90).max(90),
  longitude:  z.number().min(-180).max(180),
});
```

```js
// src/middleware/validate.middleware.js
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: 400,
      error: "Validation Failed",
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;  // sanitized data
  next();
};
```

---

#### 3.5 Winston Logger + Morgan — Logging

> ✅ **Winston** structured logging + **Morgan** HTTP request logging với requestId (MDC equivalent)

```js
// src/utils/logger.js
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, requestId }) =>
      `${timestamp} [${requestId ?? "-"}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});
```

```js
// src/app.js — gắn requestId vào mọi request
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID().slice(0, 8);
  req.log = logger.child({ requestId: req.requestId });  // logger theo request
  next();
});
```

---

#### 3.6 Circuit Breaker — Opossum

> ✅ **Opossum** — ngắt kết nối Python server khi lỗi liên tiếp, tránh cascade failure

```js
// src/config/circuitBreaker.js
import CircuitBreaker from "opossum";
import axios from "axios";

const callModelServerFn = async (data) => {
  const res = await axios.post(
    `${process.env.MODEL_SERVER_URL}/predict`,
    data,
    { timeout: 10_000 }   // 10s timeout
  );
  return res.data.price;
};

const options = {
  timeout:              10_000,  // Gọi quá 10s → lỗi
  errorThresholdPercentage: 50,  // 50% lỗi → mở breaker
  resetTimeout:         30_000,  // Sau 30s thử lại
};

export const modelBreaker = new CircuitBreaker(callModelServerFn, options);

// Fallback khi breaker mở
modelBreaker.fallback(() => {
  throw new Error("Model server is currently unavailable. Please try again later.");
});

// Logging khi state thay đổi
modelBreaker.on("open",     () => logger.warn("Circuit breaker OPEN"));
modelBreaker.on("halfOpen", () => logger.info("Circuit breaker HALF-OPEN"));
modelBreaker.on("close",    () => logger.info("Circuit breaker CLOSED"));
```

---

#### 3.7 Caching — node-cache

> ✅ **node-cache** in-memory cache — cache kết quả dự đoán theo hash của input, TTL 10 phút

```js
// src/config/cache.js
import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
// stdTTL: 600s = 10 phút, checkperiod: dọn dẹp expired keys mỗi 2 phút
```

```js
// src/services/prediction.service.js
import { cache } from "../config/cache.js";
import { modelBreaker } from "../config/circuitBreaker.js";
import { prisma } from "../config/db.js";
import crypto from "crypto";

const makeCacheKey = (data) =>
  crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");

export const predictPrice = async (input) => {
  const cacheKey = makeCacheKey(input);

  // 1. Kiểm tra cache
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info("Cache hit — skipping model server call");
    return cached;
  }

  // 2. Gọi model server qua Circuit Breaker
  const price = await modelBreaker.fire(input);
  const low   = price * 0.9;
  const high  = price * 1.1;

  // 3. Lưu DB
  await prisma.predictionHistory.create({
    data: { ...input, predictedPrice: price, priceRangeLow: low, priceRangeHigh: high },
  });

  const response = {
    predictedPrice: price,
    priceRangeLow:  low,
    priceRangeHigh: high,
    confidence:     determineConfidence(input),
    timestamp:      new Date().toISOString(),
  };

  // 4. Lưu cache
  cache.set(cacheKey, response);
  return response;
};

export const getHistory = () =>
  prisma.predictionHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

const determineConfidence = ({ population, aveOccup }) => {
  if (population > 1000 && aveOccup < 4) return "cao";
  if (population > 500)                  return "trung bình";
  return "thấp";
};
```

---

#### 3.8 Rate Limiting — express-rate-limit

> ✅ Giới hạn 10 request/phút/IP cho endpoint `/predict`

```js
// src/middleware/rateLimit.middleware.js
import rateLimit from "express-rate-limit";

export const predictLimiter = rateLimit({
  windowMs:         60 * 1000,   // 1 phút
  max:              10,          // tối đa 10 request
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    status:     429,
    error:      "Too Many Requests",
    message:    "Limit: 10 requests per minute",
    retryAfter: "60s",
  },
});
```

---

#### 3.9 Global Error Handler

> ✅ Tập trung xử lý lỗi — không để lỗi raw leak ra client

```js
// src/middleware/errorHandler.middleware.js
export const errorHandler = (err, req, res, next) => {
  req.log?.error(`Unhandled error: ${err.message}`);

  if (err.message.includes("unavailable")) {
    return res.status(503).json({
      status: 503,
      error:  "Model Server Unavailable",
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 500,
    error:  "Internal Server Error",
  });
};
```

---

#### 3.10 Routes + Controller + App

```js
// src/controllers/prediction.controller.js
import { predictPrice, getHistory } from "../services/prediction.service.js";

export const predict = async (req, res, next) => {
  try {
    req.log.info("Prediction request received");
    const result = await predictPrice(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const history = async (req, res, next) => {
  try {
    res.json(await getHistory());
  } catch (err) {
    next(err);
  }
};
```

```js
// src/routes/prediction.routes.js
import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { predictLimiter } from "../middleware/rateLimit.middleware.js";
import { predictionSchema } from "../schemas/prediction.schema.js";
import { predict, history } from "../controllers/prediction.controller.js";

const router = Router();

router.post("/predict", predictLimiter, validate(predictionSchema), predict);
router.get("/history", history);

export default router;
```

```js
// src/app.js
import express from "express";
import cors    from "cors";
import helmet  from "helmet";
import morgan  from "morgan";
import "dotenv/config";
import predictionRoutes from "./routes/prediction.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();

app.use(helmet());                    // ✅ Security headers
app.use(cors());                      // ✅ CORS
app.use(express.json());
app.use(morgan("dev"));               // ✅ HTTP request logging

// requestId middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID().slice(0, 8);
  next();
});

app.use("/api/v1", predictionRoutes);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "UP", version: "2.0.0" })
);

app.use(errorHandler);               // ✅ Phải đặt cuối cùng

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
```

#### 3.11 Checklist Ngày 3–4

```
[ ] npm init + cài dependencies
[ ] Setup Prisma schema + chạy migrate dev
[ ] Viết Zod schema
[ ] Viết service (cache + circuit breaker)
[ ] Viết controller + routes
[ ] Thêm middleware: validate, rateLimit, errorHandler
[ ] Setup Winston logger với requestId
[ ] Add Helmet cho security headers
[ ] Test API: curl POST /api/v1/predict
[ ] Test /health endpoint
```

---

### **Ngày 5 — React Frontend**

#### Setup

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-query @tanstack/react-query recharts react-hook-form zod @hookform/resolvers
```

#### Custom Hook — usePrediction

```js
// src/hooks/usePrediction.js
import { useMutation, useQuery } from "@tanstack/react-query";
import { predictionApi } from "../api/predictionApi";

export const usePrediction = () => {
  const mutation = useMutation({
    mutationFn: predictionApi.predict,
  });

  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn:  predictionApi.getHistory,
    refetchOnWindowFocus: false,
  });

  return { mutation, historyQuery };
};
```

```js
// src/api/predictionApi.js
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1",
  headers: { "Content-Type": "application/json" },
});

export const predictionApi = {
  predict:    (data) => client.post("/predict", data).then(r => r.data),
  getHistory: ()     => client.get("/history").then(r => r.data),
};
```

#### Form với React Hook Form + Zod

```jsx
// src/components/PredictionForm.jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  medInc:     z.coerce.number().positive(),
  houseAge:   z.coerce.number().positive(),
  aveRooms:   z.coerce.number().positive(),
  aveBedrms:  z.coerce.number().positive(),
  population: z.coerce.number().positive(),
  aveOccup:   z.coerce.number().min(1),
  latitude:   z.coerce.number().min(-90).max(90),
  longitude:  z.coerce.number().min(-180).max(180),
});

export function PredictionForm({ onSubmit, isLoading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 8 input fields */}
      <input {...register("medInc")} placeholder="Median Income" />
      {errors.medInc && <span>{errors.medInc.message}</span>}
      {/* ... các field khác tương tự ... */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Đang dự đoán..." : "Dự đoán giá"}
      </button>
    </form>
  );
}
```

```
[ ] Init Vite + React project
[ ] Viết predictionApi.js (Axios instance)
[ ] Viết usePrediction custom hook (React Query)
[ ] Viết PredictionForm với React Hook Form + Zod
[ ] Viết ResultCard (giá + range + confidence badge)
[ ] Viết HistoryChart với Recharts (LineChart)
[ ] Xử lý lỗi 429 (rate limit) — hiện toast thông báo
[ ] Responsive mobile
```

---

### **Ngày 6 — Docker & Deploy**

#### docker-compose.yml

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: house_price_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/house_price_db
      MODEL_SERVER_URL: https://your-name-model-server.hf.space
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    # ✅ Chạy prisma migrate deploy trước khi start server
    command: sh -c "npx prisma migrate deploy && node src/app.js"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3001/api/v1
```

#### Dockerfile (Backend)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
EXPOSE 3001
CMD ["node", "src/app.js"]
```

```
[ ] Viết Dockerfile cho backend và frontend
[ ] Test docker-compose up local
[ ] Deploy backend lên Railway (connect GitHub)
[ ] Set env variables: DATABASE_URL, MODEL_SERVER_URL
[ ] Deploy frontend lên Vercel (set VITE_API_URL)
[ ] Smoke test end-to-end
```

---

### **Ngày 7 — Testing & Polish**

#### Unit Test — Jest

```js
// tests/unit/prediction.service.test.js
import { predictPrice } from "../../src/services/prediction.service.js";
import { modelBreaker } from "../../src/config/circuitBreaker.js";
import { prisma } from "../../src/config/db.js";

jest.mock("../../src/config/circuitBreaker.js");
jest.mock("../../src/config/db.js");

const validInput = {
  medInc: 5, houseAge: 10, aveRooms: 6, aveBedrms: 1,
  population: 1500, aveOccup: 3, latitude: 37, longitude: -122,
};

describe("predictPrice", () => {
  beforeEach(() => {
    modelBreaker.fire = jest.fn().mockResolvedValue(200_000);
    prisma.predictionHistory.create = jest.fn().mockResolvedValue({});
  });

  test("should return correct price range", async () => {
    const result = await predictPrice(validInput);
    expect(result.predictedPrice).toBe(200_000);
    expect(result.priceRangeLow).toBe(180_000);    // -10%
    expect(result.priceRangeHigh).toBe(220_000);   // +10%
    expect(result.confidence).toBe("cao");
  });

  test("should save to DB", async () => {
    await predictPrice(validInput);
    expect(prisma.predictionHistory.create).toHaveBeenCalledTimes(1);
  });

  test("should return cache on second call", async () => {
    await predictPrice(validInput);
    await predictPrice(validInput);                // lần 2, cùng input
    expect(modelBreaker.fire).toHaveBeenCalledTimes(1);  // chỉ gọi 1 lần
  });
});
```

#### Integration Test — Supertest

```js
// tests/integration/prediction.api.test.js
import request from "supertest";
import app from "../../src/app.js";

describe("POST /api/v1/predict", () => {
  test("200 with valid input", async () => {
    const res = await request(app)
      .post("/api/v1/predict")
      .send({ medInc: 5, houseAge: 10, aveRooms: 6, aveBedrms: 1,
              population: 1500, aveOccup: 3, latitude: 37, longitude: -122 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("predictedPrice");
  });

  test("400 with invalid input", async () => {
    const res = await request(app)
      .post("/api/v1/predict")
      .send({ medInc: -1 });   // negative — fails Zod
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Failed");
  });
});
```

```
[ ] Viết unit test cho prediction.service.js (mock circuit breaker + Prisma)
[ ] Viết integration test với Supertest (mock model server)
[ ] Test circuit breaker: tắt Python server → verify 503 fallback
[ ] Test rate limit: >10 req/phút → verify 429
[ ] Test cache: 2 request giống nhau → model chỉ gọi 1 lần
[ ] README.md hướng dẫn chạy local
[ ] Go live 🚀
```

---

## 🗃️ Database (Prisma)

```
npx prisma studio          # GUI duyệt data
npx prisma migrate dev     # Tạo migration mới
npx prisma migrate deploy  # Apply migration production
npx prisma db seed         # Seed data mẫu (optional)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Mô tả | Rate Limit |
|---|---|---|---|
| `POST` | `/api/v1/predict` | Dự đoán giá nhà | 10 req/phút/IP |
| `GET` | `/api/v1/history` | 10 dự đoán gần nhất | — |
| `GET` | `/health` | Health check | — |

---

## 🛠️ Kỹ thuật Dev — Tổng kết

| Kỹ thuật | Thư viện | Mục đích |
|---|---|---|
| **Validation** | Zod | Runtime type-safe validation |
| **ORM + Migration** | Prisma | Type-safe DB access, auto migration |
| **Circuit Breaker** | Opossum | Chống cascade failure khi Python server lỗi |
| **Caching** | node-cache | Cache kết quả, tránh gọi model lặp lại |
| **Rate Limiting** | express-rate-limit | 10 req/phút/IP |
| **Error Handling** | Express middleware | Tập trung xử lý lỗi |
| **Logging** | Winston + Morgan | Structured log với requestId |
| **Security** | Helmet | HTTP security headers |
| **Form** | React Hook Form + Zod | Client-side validation nhất quán |
| **Data Fetching** | TanStack Query | Cache, loading state, retry tự động |
| **Unit Test** | Jest | Test service logic |
| **Integration Test** | Supertest | Test HTTP endpoints |
| **Docker** | Healthcheck + depends_on | Đúng thứ tự startup |

---

## 💰 Chi phí Tổng kết

```
Google Colab (train)          → Miễn phí
HuggingFace Spaces (model)    → Miễn phí
Railway (Node.js + DB)        → Miễn phí (500h/tháng)
Vercel (React Frontend)       → Miễn phí
──────────────────────────────────────────
Tổng                          → $0 / tháng
```

---

## ⚠️ Lưu ý Quan trọng

1. **Node.js không chạy `.pkl` trực tiếp** → Python Model Server vẫn là bridge cần thiết
2. **Prisma** so với Sequelize: type-safe hơn, migration rõ ràng hơn, được khuyến nghị cho dự án mới
3. **node-cache** lưu trong RAM — restart mất cache. Scale lên → dùng Redis (`ioredis`)
4. **Zod** dùng trên cả backend (validate API) và frontend (validate form) → đảm bảo nhất quán schema
5. **TanStack Query** tự động retry và cache phía client — giảm số lần gọi API

---

*Plan version 1.0 — House Price Prediction với Node.js + React*
