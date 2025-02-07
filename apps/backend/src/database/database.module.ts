import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeederService } from './seeder.service';
import { SeedCommand } from './commands/seed.command';
import databaseConfig from '../config/database.config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const config = configService.get<TypeOrmModuleOptions>('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return {
          ...config,
          autoLoadEntities: true,
        };
      },
    }),
  ],
  providers: [SeederService, SeedCommand],
  exports: [SeederService],
})
export class DatabaseModule {}
