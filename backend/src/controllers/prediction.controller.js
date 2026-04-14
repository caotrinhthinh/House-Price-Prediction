import { predictPrice, getHistory } from "../services/prediction.service.js";

export const predict = async (req, res, next) => {
  try {
    req.log.info("Prediction request received in controller");
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
