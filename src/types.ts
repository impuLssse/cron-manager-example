export enum CronJob {
  ConvertMkvToMp4 = "ConvertMkvToMp4",
}

export interface IConfig {
  ACTIVATE_CRON_JOBS?: CronJob;
}
