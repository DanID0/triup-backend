import { Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    await this.findOne(id);
    return this.prisma.comment.update({
      where: { id },
      data: { content: updateCommentDto.content },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.comment.delete({ where: { id } });
  }
}
