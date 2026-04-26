import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [PrismaModule, BoardsModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
