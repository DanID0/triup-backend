import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BoardActivityService } from 'src/boards/board-activity.service';

const USER_PUBLIC = { select: { id: true, username: true, email: true, avatarUrl: true } } as const;

const TASK_INCLUDE = {
  assignee: USER_PUBLIC,
  comments: {
    include: { user: USER_PUBLIC },
    orderBy: { createdAt: 'asc' },
  },
} as const;

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private readonly activity: BoardActivityService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    await this.assertCanEditBoardByColumn(createTaskDto.columnId, userId);
    const created = await this.prisma.task.create({
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
    const column = await this.prisma.column.findUnique({
      where: { id: createTaskDto.columnId },
      select: { name: true, boardId: true },
    });
    if (column) {
      await this.activity.log({
        boardId: column.boardId,
        userId,
        type: 'TASK_CREATED',
        message: `created task "${created.name}" in "${column.name}"`,
      });
    }
    return created;
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

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        columnId: true,
        dueDate: true,
        completed: true,
        description: true,
        priority: true,
        assigneeId: true,
        attachments: true,
        labels: true,
      },
    });
    if (!existing) throw new NotFoundException(`Task with id ${id} not found`);
    const targetColumnId = updateTaskDto.columnId ?? existing.columnId;
    await this.assertCanEditBoardByColumn(targetColumnId, userId);
    // Prisma treats undefined as "no change" and null as "set to null".
    // Keep that distinction so clients can explicitly clear fields.
    const updated = await this.prisma.task.update({
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

    const [fromColumn, toColumn] = await Promise.all([
      this.prisma.column.findUnique({
        where: { id: existing.columnId },
        select: { name: true, boardId: true },
      }),
      this.prisma.column.findUnique({
        where: { id: updated.columnId },
        select: { name: true, boardId: true },
      }),
    ]);
    const boardId = toColumn?.boardId ?? fromColumn?.boardId;
    if (boardId) {
      if (existing.columnId !== updated.columnId) {
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_MOVED',
          message: `moved task "${updated.name}" from "${fromColumn?.name || 'Unknown'}" to "${toColumn?.name || 'Unknown'}"`,
        });
      }
      if (
        updateTaskDto.completed !== undefined &&
        updateTaskDto.completed !== existing.completed
      ) {
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_UPDATED',
          message: `${updateTaskDto.completed ? 'marked' : 'unmarked'} task "${updated.name}" as complete`,
        });
      }
      if (
        updateTaskDto.dueDate !== undefined &&
        String(updateTaskDto.dueDate) !== String(existing.dueDate?.toISOString() ?? null)
      ) {
        const nextDue = updated.dueDate ? new Date(updated.dueDate).toLocaleString() : null;
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_UPDATED',
          message: nextDue
            ? `set due date of "${updated.name}" to ${nextDue}`
            : `removed due date from "${updated.name}"`,
        });
      }
      if (updateTaskDto.name !== undefined && updateTaskDto.name !== existing.name) {
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_UPDATED',
          message: `renamed task from "${existing.name}" to "${updateTaskDto.name}"`,
        });
      }
      if (
        updateTaskDto.priority !== undefined &&
        updateTaskDto.priority !== existing.priority
      ) {
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_UPDATED',
          message: `changed priority of "${updated.name}" from ${existing.priority} to ${updateTaskDto.priority}`,
        });
      }
      if (
        updateTaskDto.description !== undefined &&
        (updateTaskDto.description ?? '') !== (existing.description ?? '')
      ) {
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_UPDATED',
          message: updateTaskDto.description
            ? `updated description of "${updated.name}"`
            : `cleared description of "${updated.name}"`,
        });
      }
      if (
        updateTaskDto.assigneeId !== undefined &&
        updateTaskDto.assigneeId !== existing.assigneeId
      ) {
        const [fromUser, toUser] = await Promise.all([
          existing.assigneeId
            ? this.prisma.user.findUnique({
                where: { id: existing.assigneeId },
                select: { username: true },
              })
            : Promise.resolve(null),
          updateTaskDto.assigneeId
            ? this.prisma.user.findUnique({
                where: { id: updateTaskDto.assigneeId },
                select: { username: true },
              })
            : Promise.resolve(null),
        ]);
        await this.activity.log({
          boardId,
          userId,
          type: 'TASK_UPDATED',
          message: toUser?.username
            ? `assigned "${updated.name}" to ${toUser.username}${fromUser?.username ? ` (was ${fromUser.username})` : ''}`
            : `unassigned "${updated.name}"${fromUser?.username ? ` (was ${fromUser.username})` : ''}`,
        });
      }
      if (updateTaskDto.attachments !== undefined) {
        const before = existing.attachments ?? [];
        const after = updated.attachments ?? [];
        const added = after.filter((x) => !before.includes(x));
        const removed = before.filter((x) => !after.includes(x));
        if (added.length) {
          await this.activity.log({
            boardId,
            userId,
            type: 'TASK_UPDATED',
            message: `added ${added.length} attachment${added.length > 1 ? 's' : ''} to "${updated.name}"`,
          });
        }
        if (removed.length) {
          await this.activity.log({
            boardId,
            userId,
            type: 'TASK_UPDATED',
            message: `removed ${removed.length} attachment${removed.length > 1 ? 's' : ''} from "${updated.name}"`,
          });
        }
      }
      if (updateTaskDto.labels !== undefined) {
        const before = existing.labels ?? [];
        const after = updated.labels ?? [];
        const added = after.filter((x) => !before.includes(x));
        const removed = before.filter((x) => !after.includes(x));
        if (added.length || removed.length) {
          await this.activity.log({
            boardId,
            userId,
            type: 'TASK_UPDATED',
            message: `updated labels on "${updated.name}"`,
          });
        }
      }
    }
    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, columnId: true, name: true },
    });
    if (!existing) throw new NotFoundException(`Task with id ${id} not found`);
    await this.assertCanEditBoardByColumn(existing.columnId, userId);
    const column = await this.prisma.column.findUnique({
      where: { id: existing.columnId },
      select: { boardId: true },
    });
    const deleted = await this.prisma.task.delete({ where: { id } });
    if (column) {
      await this.activity.log({
        boardId: column.boardId,
        userId,
        type: 'TASK_DELETED',
        message: `deleted task "${existing.name}"`,
      });
    }
    return deleted;
  }

  private async assertCanEditBoardByColumn(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      select: {
        board: {
          select: {
            id: true,
            workspace: { select: { userId: true } },
          },
        },
      },
    });
    if (!column?.board) throw new NotFoundException(`Column with id ${columnId} not found`);

    if (column.board.workspace.userId === userId) return;

    const member = await this.prisma.userBoard.findFirst({
      where: { boardId: column.board.id, userId },
      select: { invitedUserRights: true },
    });
    if (!member) throw new ForbiddenException('You do not have access to this board');
    if (member.invitedUserRights === 'Guest') {
      throw new ForbiddenException('Guests cannot edit tasks');
    }
  }
}
