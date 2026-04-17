import { z } from "zod";

export const predictionSchema = z.object({
  OverallQual:   z.number().min(1).max(10),
  YearBuilt:     z.number().min(1850).max(new Date().getFullYear()),
  YearRemodAdd:  z.number().min(1850).max(new Date().getFullYear()),
  TotalBsmtSF:   z.number().min(0),
  '1stFlrSF':    z.number().min(0),
  '2ndFlrSF':    z.number().min(0),
  GrLivArea:     z.number().min(0),
  FullBath:      z.number().min(0),
  TotRmsAbvGrd:  z.number().min(0),
  GarageCars:    z.number().min(0),
  GarageArea:    z.number().min(0),
});
