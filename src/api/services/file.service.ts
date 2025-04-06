import { writeFile } from "fs/promises";

export class FileService {
  async saveBufferToFileSystem(path: string, videoBuffer: Buffer) {
    await writeFile(path, videoBuffer);
  }
}
