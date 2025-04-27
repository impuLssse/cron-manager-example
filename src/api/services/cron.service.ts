import chalk from "chalk";
import cron from "node-cron";
import { appLogger } from "@winston-logger";

export type TaskContext = {
  updateProgress: (progress: number) => Promise<void>;
};
export interface ITask {
  name: string;
  handler: (ctx: TaskContext) => Promise<void> | void;
  /** Запланировать выполнение крон задач по паттерну */
  schedule?: string;
  /** Запланировать выполнение крон задач на каждые N секунд */
  everyInSeconds?: number;
}
export interface ITaskInQueue {
  task: ITask;
  ctx: TaskContext;
}

export class CronManager {
  private queue: ITaskInQueue[] = [];

  addTask(task: ITask): void {
    const equipmentTask: ITaskInQueue = {
      task,
      ctx: {
        updateProgress: async (progress) => {
          appLogger.info(
            `Task ${chalk.bold(chalk.greenBright(task.name))} has progress: ${chalk.bold(chalk.greenBright(progress + `%`))}`,
          );
        },
      },
    };

    if (task?.schedule && task?.everyInSeconds) {
      throw new Error(`Нельзя одновременно указать schedule и every`);
    }
    if (task?.schedule) {
      if (!cron.validate(task?.schedule)) {
        throw new Error(`Указана неверная регулярка для кроны`);
      }

      cron.schedule(task.schedule, () => {
        this.queue.push(equipmentTask);
        this.processQueue();
      });
      return;
    }

    if (task?.everyInSeconds) {
      if (task.everyInSeconds <= 0) {
        throw new Error(`Указана неверная every для кроны`);
      }

      setInterval(() => {
        this.queue.push(equipmentTask);
        this.processQueue();
      }, task.everyInSeconds * 1000);
      return;
    }

    this.queue.push(equipmentTask);
    this.processQueue();
  }

  private activeTaskNames = new Set<string>();

  private async processQueue(): Promise<void> {
    if (!this.queue.length) return;

    /** Берем первую джобу и удаляем ее из очереди */
    const taskInQueue = this.queue.shift();
    const taskName = taskInQueue.task.name;

    const taskIsProcessing = this.activeTaskNames.has(taskName);
    if (taskIsProcessing) {
      appLogger.info(chalk.bold(`${taskName}`, `already in progress`));
      return;
    }

    /** Добавляем задачу в активные и забираем из массива */
    this.activeTaskNames.add(taskName);

    if (taskInQueue) {
      const fn = taskInQueue.task.handler as (ctx: TaskContext) => Promise<void>;

      fn(taskInQueue.ctx)
        .then(() => {
          /** Таска завершена */
          appLogger.info(`Task ${chalk.bold(chalk.greenBright(taskName))} completed`);
        })
        .catch((e) => {
          appLogger.fatal(`Task ${chalk.bold(taskName)} failed`);
          console.log(e);
        })
        .finally(async () => {
          /** Удаляем задачу из очереди */
          this.activeTaskNames.delete(taskName);
        });
    }

    /** Вызываем рекурсивно до полной обработки очереди крон задач */
    this.processQueue();
  }
}
