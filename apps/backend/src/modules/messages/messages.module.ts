import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentMessage } from './entities/agent-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentMessage])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class MessagesModule {}
