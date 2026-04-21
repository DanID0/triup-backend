import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  create(createCommentDto: CreateCommentDto, userId: string) {
    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        taskId: createCommentDto.taskId,
        userId,
      },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }

  findAllByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    if (!comment) throw new NotFoundException(`Comment with id ${id} not found`);
    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const existing = await this.findOne(id);
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    return this.prisma.comment.update({
      where: { id },
      data: { content: updateCommentDto.content },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id);
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    return this.prisma.comment.delete({ where: { id } });
  }
}
