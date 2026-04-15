import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        name: createTaskDto.name,
        description: createTaskDto.description,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
        columnId: createTaskDto.columnId,
        assigneeId: createTaskDto.assigneeId,
        priority: createTaskDto.priority,
      },
    });
  }

  findAllByColumn(columnId: string) {
    return this.prisma.task.findMany({
      where: { columnId },
      include: { assignee: { select: { id: true, username: true, email: true } }, comments: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, username: true, email: true } }, comments: true },
    });
    if (!task) throw new NotFoundException(`Task with id ${id} not found`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        name: updateTaskDto.name,
        description: updateTaskDto.description,
        dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
        columnId: updateTaskDto.columnId,
        assigneeId: updateTaskDto.assigneeId,
        priority: updateTaskDto.priority,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
