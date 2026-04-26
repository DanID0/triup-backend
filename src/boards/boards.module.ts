import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { BoardMembersController } from './members.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BoardActivityService } from './board-activity.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoardsController, BoardMembersController],
  providers: [BoardsService, BoardActivityService],
  exports: [BoardActivityService],
})
export class BoardsModule {}
