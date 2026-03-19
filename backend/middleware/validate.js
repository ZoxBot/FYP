const AppError = require("../utils/AppError");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error.errors || error.issues) {
        const issues = error.errors || error.issues;
        const message = issues.map((i) => i.message).join(", ");
        return next(new AppError(message, 400));
    }
    next(error);
  }
};

module.exports = validate;
