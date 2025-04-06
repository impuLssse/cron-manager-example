import { knexClient } from "@main";

export type IVideo = Partial<{
  keyInS3: string;
  id: string;
  status: string;
  createdAt: string;
}>;

export class VideoService {
  async getAllVideos(): Promise<IVideo[]> {
    return knexClient.table("video_conversions").select().limit(15);
  }

  async createVideo(id: string): Promise<IVideo> {
    return knexClient.table("video_conversions").insert({ id }).returning<IVideo>("*");
  }

  async getVideo(videoId: string): Promise<IVideo> {
    return knexClient
      .table("video_conversions")
      .select()
      .where("id", "=", videoId)
      .limit(1)?.[0];
  }

  async getVideosWithPendingStatus(): Promise<IVideo[]> {
    return knexClient.table("video_conversions").where("status", "=", "pending").limit(1);
  }

  async updateVideo(videoId: string, video: Omit<IVideo, "id">) {
    await knexClient.table("video_conversions").update(video).where("id", "=", videoId);
  }

  async deleteVideo(videoId: string) {
    await knexClient.table("video_conversions").delete().where("id", "=", videoId);
  }
}
