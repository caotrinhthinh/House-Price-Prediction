import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { predictLimiter } from "../middleware/rateLimit.middleware.js";
import { predictionSchema } from "../schemas/prediction.schema.js";
import { predict, history } from "../controllers/prediction.controller.js";

const router = Router();

router.post("/predict", predictLimiter, validate(predictionSchema), predict);
router.get("/history", history);

export default router;
