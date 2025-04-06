import fs from "fs";
import path from "path";
import { promisify } from "util";
import { rm } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import { exec } from "child_process";
import { appLogger } from "@winston-logger";
import { s3Service, videoService } from "@main";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath.path);
const e = promisify(exec);

export const convertMkvToMp4Task = async () => {
  // Ищем видео, которые ожидают конвертации
  const videos = await videoService.getVideosWithPendingStatus();
  if (!videos.length) appLogger.info("Videos to conversion not found");

  for (const video of videos) {
    const baseVideosPath = path.resolve(__dirname, "..", "..");
    const keyInS3 = `videos/${video.id}.mp4`;
    const mkvFile = path.resolve(baseVideosPath, "videos/mkv", video.id + ".mkv");
    const mp4File = path.resolve(baseVideosPath, "videos/mp4", video.id + ".mp4");

    // Удаляем видео, которое не было найдено в файловой системе
    if (!fs.existsSync(mkvFile)) {
      await videoService.deleteVideo(video.id);
      continue;
    }

    // Конвертируем mkv в mp4
    appLogger.info(`[${video.id}] Start conversion`);

    try {
      await e(`ffmpeg -y -i ${mkvFile} -c:v libx264 -c:a aac ${mp4File}`);
    } catch (e) {
      console.log(e);
    }

    // Отправляем сконвертированный файл в хранилище
    appLogger.info(`[${video.id}] Upload video ${video.id} to s3`);
    await s3Service.uploadLocalFileToS3(keyInS3, mp4File);

    // Меняем статус .mp4 видео после загрузки в s3
    await videoService.updateVideo(video.id, {
      keyInS3,
      status: "finished",
    });

    // Подчищаем оба файла
    appLogger.info(`[${video.id}] Remove video ${video.id} from filesystem`);
    await rm(mkvFile, { force: true });
    await rm(mp4File, { force: true });
  }
};
