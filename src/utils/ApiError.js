class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong! ",
    data,
    error = []
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.error = error;
  }
}

export { ApiError}