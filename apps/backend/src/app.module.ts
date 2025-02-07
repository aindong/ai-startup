import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentsModule } from './modules/agents/agents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { MessagesModule } from './modules/messages/messages.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './config/database.config';
import queueConfig from './config/queue.config';
import { DataSourceOptions } from 'typeorm';
import { BullModuleOptions } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, queueConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<DataSourceOptions>('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return {
          ...config,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<BullModuleOptions>('queue');
        if (!config) {
          throw new Error('Queue configuration not found');
        }
        return config;
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    AgentsModule,
    TasksModule,
    AuthModule,
    CollaborationModule,
    MessagesModule,
    RoomsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
