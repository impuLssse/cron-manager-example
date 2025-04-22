export enum CronJob {
  ConvertMkvToMp4 = "ConvertMkvToMp4",
}

export type IVideo = Partial<{
  keyInS3: string;
  id: string;
  status: string;
  createdAt: string;
}>;

export interface IConfig {
  ACTIVATE_CRON_JOBS?: CronJob;
}
