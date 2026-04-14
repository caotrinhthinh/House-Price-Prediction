export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: 400,
      error: "Validation Failed",
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data; // sanitized data
  next();
};
