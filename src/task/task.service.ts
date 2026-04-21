import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const TASK_INCLUDE = {
  assignee: { select: { id: true, username: true, email: true } },
  comments: {
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  },
} as const;

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        name: createTaskDto.name,
        description: createTaskDto.description ?? undefined,
        dueDate:
          createTaskDto.dueDate === undefined
            ? undefined
            : createTaskDto.dueDate === null
              ? null
              : new Date(createTaskDto.dueDate),
        columnId: createTaskDto.columnId,
        assigneeId: createTaskDto.assigneeId ?? undefined,
        priority: createTaskDto.priority,
        completed: createTaskDto.completed,
        labels: createTaskDto.labels ?? [],
        attachments: createTaskDto.attachments ?? [],
      } as any,
      include: TASK_INCLUDE as any,
    });
  }

  findAllByColumn(columnId: string) {
    return this.prisma.task.findMany({
      where: { columnId },
      include: TASK_INCLUDE as any,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE as any,
    });
    if (!task) throw new NotFoundException(`Task with id ${id} not found`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);
    // Prisma treats undefined as "no change" and null as "set to null".
    // Keep that distinction so clients can explicitly clear fields.
    return this.prisma.task.update({
      where: { id },
      data: {
        name: updateTaskDto.name,
        description: updateTaskDto.description,
        dueDate:
          updateTaskDto.dueDate === undefined
            ? undefined
            : updateTaskDto.dueDate === null
              ? null
              : new Date(updateTaskDto.dueDate),
        columnId: updateTaskDto.columnId,
        assigneeId: updateTaskDto.assigneeId,
        priority: updateTaskDto.priority,
        completed: updateTaskDto.completed,
        labels: updateTaskDto.labels,
        attachments: updateTaskDto.attachments,
      } as any,
      include: TASK_INCLUDE as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
