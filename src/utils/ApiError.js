class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong! ",
    data,
    error = []
  ) {
    super(message)
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.error = error;
  }
}

export { ApiError}