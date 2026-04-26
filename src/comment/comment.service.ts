import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BoardActivityService } from 'src/boards/board-activity.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private readonly activity: BoardActivityService,
  ) {}

  create(createCommentDto: CreateCommentDto, userId: string) {
    return this.assertCanEditTaskComments(createCommentDto.taskId, userId).then(async () => {
      const created = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        taskId: createCommentDto.taskId,
        userId,
      },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
      });
      const task = await this.prisma.task.findUnique({
        where: { id: createCommentDto.taskId },
        select: {
          name: true,
          column: {
            select: { boardId: true },
          },
        },
      });
      if (task?.column?.boardId) {
        await this.activity.log({
          boardId: task.column.boardId,
          userId,
          type: 'COMMENT',
          message: `commented on "${task.name}"`,
          meta: {
            commentId: created.id,
            commentPreview: created.content.slice(0, 160),
          },
        });
      }
      return created;
    });
  }

  findAllByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
    });
    if (!comment) throw new NotFoundException(`Comment with id ${id} not found`);
    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const existing = await this.findOne(id);
    await this.assertCanEditTaskComments(existing.taskId, userId);
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    return this.prisma.comment.update({
      where: { id },
      data: { content: updateCommentDto.content },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id);
    await this.assertCanEditTaskComments(existing.taskId, userId);
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    return this.prisma.comment.delete({ where: { id } });
  }

  private async assertCanEditTaskComments(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        column: {
          select: {
            board: {
              select: {
                id: true,
                workspace: { select: { userId: true } },
              },
            },
          },
        },
      },
    });
    const board = task?.column?.board;
    if (!board) throw new NotFoundException(`Task with id ${taskId} not found`);
    if (board.workspace.userId === userId) return;

    const member = await this.prisma.userBoard.findFirst({
      where: { boardId: board.id, userId },
      select: { invitedUserRights: true },
    });
    if (!member) throw new ForbiddenException('You do not have access to this board');
    if (member.invitedUserRights === 'Guest') {
      throw new ForbiddenException('Guests cannot modify comments');
    }
  }
}
