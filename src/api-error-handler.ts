import { ApiError } from "@api-error";
import { appLogger } from "@winston-logger";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export async function apiErrorHandler(
  error: FastifyError,
  _: FastifyRequest,
  reply: FastifyReply,
) {
  console.error(error);
  const isApiError = error instanceof ApiError;
  const isNotMultipartError = error.message === "the request is not multipart";

  if (isApiError) return reply.code(500).send(error.message.toUpperCase());
  /**
   * Если приходит ошибка валидации
   */
  if (error?.code == "FST_ERR_VALIDATION")
    return reply.code(400).send("FST_ERR_VALIDATION");
  if (error?.code == "FST_REQ_FILE_TOO_LARGE")
    return reply.code(400).send("FST_REQ_FILE_TOO_LARGE");
  if (error?.code == "FST_ERR_CTP_INVALID_MEDIA_TYPE")
    return reply.code(400).send("FST_ERR_CTP_INVALID_MEDIA_TYPE");
  if (error?.code == "FST_ERR_CTP_EMPTY_JSON_BODY")
    return reply.code(400).send("FST_ERR_CTP_EMPTY_JSON_BODY");
  if (isNotMultipartError) return reply.code(400).send("Выберите файл");

  appLogger.fatal(error.message);
  return reply.code(500).send("Непредвиденная ошибка");
}
