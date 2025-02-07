import { registerAs } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export default registerAs(
  'queue',
  (): BullModuleOptions => ({
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }),
);
