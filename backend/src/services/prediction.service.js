import { cache } from "../config/cache.js";
import { modelBreaker } from "../config/circuitBreaker.js";
import { prisma } from "../config/db.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

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

  // 2. Gọi API Python qua Circuit Breaker
  // Kết quả trả về sẽ là raw json output từ app.py
  const apiResponse = await modelBreaker.fire(input);
  
  if (!apiResponse.success) {
      throw new Error(apiResponse.error || "Model server failed without specific reason");
  }

  const price = apiResponse.data.price;

  // 3. Lưu DB sử dụng Prisma
  await prisma.predictionHistory.create({
    data: {
      OverallQual: input.OverallQual,
      YearBuilt: input.YearBuilt,
      YearRemodAdd: input.YearRemodAdd,
      TotalBsmtSF: input.TotalBsmtSF,
      firstFlrSF: input["1stFlrSF"], // mapped from Prisma
      secondFlrSF: input["2ndFlrSF"],
      GrLivArea: input.GrLivArea,
      FullBath: input.FullBath,
      TotRmsAbvGrd: input.TotRmsAbvGrd,
      GarageCars: input.GarageCars,
      GarageArea: input.GarageArea,
      predictedPrice: price
    },
  });

  const response = {
    ...apiResponse.data,
    timestamp: new Date().toISOString(),
  };

  // 4. Lưu Cache
  cache.set(cacheKey, response);
  return response;
};

export const getHistory = () => {
  return prisma.predictionHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
};
