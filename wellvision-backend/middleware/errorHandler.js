/*
|--------------------------------------------------------------------------
| Global Error Handler Middleware
|--------------------------------------------------------------------------
| Catches all errors forwarded with next(error) and responds with a clean,
| consistent error message.
*/

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error caught:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

export default errorHandler;
