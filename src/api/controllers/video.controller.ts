import path from "path";
import { v4 } from "uuid";
import { validate } from "uuid";
import { ApiError } from "@api-error";
import { fileService, videoService } from "@main";
import { FastifyInstance, FastifyReply, FastifyRequest, RegisterOptions } from "fastify";

export const videoRouter = (
  fastify: FastifyInstance,
  _: RegisterOptions = {},
  done: any,
) => {
  /**
   * Получение всех видео
   */
  fastify.route({
    method: "GET",
    url: "/videos",
    handler: async (_: FastifyRequest, reply: FastifyReply) => {
      const videos = await videoService.getAllVideos();
      return reply.send(
        videos.map((video) => ({
          ...video,
          keyInS3:
            process.env.S3_ENDPOINT + "/" + process.env.S3_BUCKET + `/videos/${video.id}`,
        })),
      );
    },
  });

  /**
   * Получение видео
   */
  fastify.route({
    method: "GET",
    url: "/video/:videoId",
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const videoId = req.params["videoId"];
      if (!validate(videoId)) {
        throw ApiError.badRequest({ msg: "I need UUID format" });
      }

      const video = await videoService.getVideo(videoId);
      if (!videoId) {
        return reply.send(null).code(404);
      }
      return reply.send(video);
    },
  });

  /**
   * Конвертация видео
   */
  fastify.route({
    method: "POST",
    url: "/video/convert",
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const createdVideoId = v4();
      const videoFile = await req.file();
      const videoBuffer = await videoFile.toBuffer();

      if (!videoFile?.file || !videoFile?.filename) {
        throw ApiError.badRequest({ msg: "File ex. is not valid" });
      }
      if (path.extname(videoFile.filename) !== ".mkv") {
        throw ApiError.badRequest({
          msg: "You can upload only MKV files",
        });
      }

      // Сохраняем видео на сервер
      await fileService.saveBufferToFileSystem(
        path.resolve(__dirname, `../../../videos/mkv`, `${createdVideoId}.mkv`),
        videoBuffer,
      );

      // Добавляем видео в статусе pending (ожидает конвертации)
      const createdVideo = await videoService.createVideo(createdVideoId);
      return reply.send(createdVideo);
    },
  });

  done();
};
