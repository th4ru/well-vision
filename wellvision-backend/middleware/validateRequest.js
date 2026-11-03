import { validationResult } from 'express-validator';

/*
|--------------------------------------------------------------------------
| Middleware to handle validation errors
|--------------------------------------------------------------------------
*/

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => err.msg)
    });
  }

  next(); // Proceed if no validation errors
};

export default validateRequest;
