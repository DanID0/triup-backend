import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BoardActivityService } from 'src/boards/board-activity.service';

@Injectable()
export class ColumnService {
  constructor(
    private prisma: PrismaService,
    private readonly activity: BoardActivityService,
  ) {}

  async create(createColumnDto: CreateColumnDto, userId: string) {
    await this.assertCanEditBoard(createColumnDto.boardId, userId);
    const created = await this.prisma.column.create({
      data: {
        name: createColumnDto.name,
        boardId: createColumnDto.boardId,
        color: createColumnDto.color,
        position: createColumnDto.position ?? 0,
      } as any,
    });
    await this.activity.log({
      boardId: createColumnDto.boardId,
      userId,
      type: 'COLUMN_CREATED',
      message: `created list "${created.name}"`,
    });
    return created;
  }

  findAllByBoard(boardId: string) {
    return this.prisma.column.findMany({
      where: { boardId },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    if (!column) throw new NotFoundException(`Column with id ${id} not found`);
    return column;
  }

  async update(id: string, updateColumnDto: UpdateColumnDto, userId: string) {
    const existing = await this.prisma.column.findUnique({
      where: { id },
      select: { id: true, boardId: true, name: true },
    });
    if (!existing) throw new NotFoundException(`Column with id ${id} not found`);
    await this.assertCanEditBoard(updateColumnDto.boardId ?? existing.boardId, userId);
    const updated = await this.prisma.column.update({
      where: { id },
      data: {
        name: updateColumnDto.name,
        color: updateColumnDto.color,
        position: updateColumnDto.position,
        boardId: updateColumnDto.boardId,
      } as any,
    });
    if (updateColumnDto.name !== undefined && updateColumnDto.name !== existing.name) {
      await this.activity.log({
        boardId: updated.boardId,
        userId,
        type: 'COLUMN_UPDATED',
        message: `renamed list from "${existing.name}" to "${updateColumnDto.name}"`,
      });
    }
    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.column.findUnique({
      where: { id },
      select: { id: true, boardId: true, name: true },
    });
    if (!existing) throw new NotFoundException(`Column with id ${id} not found`);
    await this.assertCanEditBoard(existing.boardId, userId);
    const deleted = await this.prisma.column.delete({ where: { id } });
    await this.activity.log({
      boardId: existing.boardId,
      userId,
      type: 'COLUMN_DELETED',
      message: `deleted list "${existing.name}"`,
    });
    return deleted;
  }

  private async assertCanEditBoard(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, workspace: { select: { userId: true } } },
    });
    if (!board) throw new NotFoundException(`Board with id ${boardId} not found`);
    if (board.workspace.userId === userId) return;

    const member = await this.prisma.userBoard.findFirst({
      where: { boardId, userId },
      select: { invitedUserRights: true },
    });
    if (!member) throw new ForbiddenException('You do not have access to this board');
    if (member.invitedUserRights === 'Guest') {
      throw new ForbiddenException('Guests cannot edit board content');
    }
  }
}
