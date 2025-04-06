import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";

export class S3Service {
  s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY, // Ваш ключ доступа
        secretAccessKey: process.env.S3_SECRET_KEY, // Ваш секретный ключ
      },
    });
  }

  async uploadLocalFileToS3(key: string, src: string) {
    const uploadCommand = new PutObjectCommand({
      Key: key,
      Body: await readFile(src),
      Bucket: process.env.S3_BUCKET,
      ContentType: "video/mp4",
    });
    await this.s3Client.send(uploadCommand);
  }

  async getFileFromS3(key: string) {
    const getCommand = new GetObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET,
    });
    const foundFile = await this.s3Client.send(getCommand);
    return foundFile.Body;
  }
}
