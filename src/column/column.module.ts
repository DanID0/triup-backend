import { Module } from '@nestjs/common';
import { ColumnService } from './column.service';
import { ColumnController } from './column.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [PrismaModule, BoardsModule],
  controllers: [ColumnController],
  providers: [ColumnService],
})
export class ColumnModule {}
