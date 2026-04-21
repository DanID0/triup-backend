import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces/workspaces.module';
import { PrismaModule } from './prisma/prisma.module';
import { BoardsModule } from './boards/boards.module';
import { TaskModule } from './task/task.module';
import { ColumnModule } from './column/column.module';
import { CommentModule } from './comment/comment.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    WorkspacesModule,
    BoardsModule,
    ColumnModule,
    TaskModule,
    CommentModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
