import { z } from 'zod';

export const predictionSchema = z.object({
  OverallQual: z.coerce.number().min(1).max(10),
  YearBuilt: z.coerce.number().min(1850).max(new Date().getFullYear()),
  YearRemodAdd: z.coerce.number().min(1850).max(new Date().getFullYear()),
  TotalBsmtSF: z.coerce.number().min(0),
  '1stFlrSF': z.coerce.number().min(0),
  '2ndFlrSF': z.coerce.number().min(0),
  GrLivArea: z.coerce.number().min(0),
  FullBath: z.coerce.number().min(0),
  TotRmsAbvGrd: z.coerce.number().min(0),
  GarageCars: z.coerce.number().min(0),
  GarageArea: z.coerce.number().min(0),
});
