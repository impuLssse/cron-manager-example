import { CronJob, IConfig } from "@types";
import "dotenv/config";
export const appConfig = process.env as IConfig;

import knex from "knex";
import fastify from "fastify";
import knexConfig from "../knexfile";
import { appLogger } from "@winston-logger";
import { convertMkvToMp4Task } from "@tasks";
import { videoRouter } from "@api/controllers";
import { fastifyFormbody } from "@fastify/formbody";
import { apiErrorHandler } from "@api-error-handler";
import { fastifyMultipart } from "@fastify/multipart";
import { FileService, S3Service, VideoService } from "@api/services";

// Инициализация сервисов и БД
export const knexClient = knex(knexConfig);
export const s3Service = new S3Service();
export const fileService = new FileService();
export const videoService = new VideoService();

async function bootstrapApp() {
  const app = fastify();
  app.setErrorHandler(apiErrorHandler); // Устанавливаем обработчик ошибок

  const activatedCronJobs = appConfig?.ACTIVATE_CRON_JOBS?.split(",") || [];
  for (const activatedCronJob of activatedCronJobs) {
    switch (activatedCronJob) {
      case CronJob.ConvertMkvToMp4:
        setInterval(() => {
          convertMkvToMp4Task();
        }, 3000);
        // Добавляем таску в очередь
        break;
    }
  }
  await app.register(fastifyFormbody); // Регистируем плагины для работы с файлами
  await app.register(fastifyMultipart, {
    limits: {
      fieldSize: 30000,
      fileSize: 30000 * 1024 * 1024, // Максимальный размер файла в МБ
    },
  });
  app.register(videoRouter); // Регистрируем маршруты видео

  await app.listen({ port: 4001 });
  appLogger.verbose("Server started");
}
bootstrapApp();
