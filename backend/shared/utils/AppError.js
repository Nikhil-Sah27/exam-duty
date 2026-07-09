class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    if (details !== null && details !== undefined) {
      this.details = details;
    }
  }
}

module.exports = AppError;
