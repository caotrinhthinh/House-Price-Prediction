import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import predictionRoutes from "./routes/prediction.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { logger } from "./utils/logger.js";
import crypto from "crypto";

const app = express();

app.use(helmet());                    // Security headers
app.use(cors());                      // CORS
app.use(express.json());

// Morgan HTTP logger with simple formatting
app.use(morgan("dev"));               

// requestId middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID().slice(0, 8);
  req.log = logger.child({ requestId: req.requestId });
  next();
});

app.use("/api/v1", predictionRoutes);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "UP", version: "2.0.0" })
);

app.use(errorHandler);               // Phải đặt cuối cùng

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
