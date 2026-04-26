import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [PrismaModule, BoardsModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
