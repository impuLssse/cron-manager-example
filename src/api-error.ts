export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors = [],
  ) {
    super(message);
  }

  static badRequest({ msg } = { msg: "Плохой запрос" }): ApiError {
    return new ApiError(400, msg, undefined);
  }

  static notFound({ msg } = { msg: "Не найдено" }): ApiError {
    return new ApiError(404, msg, undefined);
  }
}
