import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const TASK_INCLUDE = {
  assignee: { select: { id: true, username: true, email: true } },
  comments: {
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  },
} as const;

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  create(createBoardDto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        workspaceId: createBoardDto.workspaceId,
      },
    });
  }

  findAll(workspaceId: string) {
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: { include: TASK_INCLUDE as any, orderBy: { createdAt: 'asc' } },
          },
        },
        UserBoard: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });
    if (!board) throw new NotFoundException(`Board ${id} not found`);
    return board;
  }

  async findByShareToken(token: string) {
    const board = await this.prisma.board.findUnique({
      where: { shareToken: token } as any,
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: { include: TASK_INCLUDE as any, orderBy: { createdAt: 'asc' } },
          },
        },
        UserBoard: {
          include: { user: { select: { id: true, username: true, email: true } } },
        },
      },
    });
    if (!board) throw new NotFoundException('Shared board not found');
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({
      where: { id },
      data: {
        name: updateBoardDto.name,
        workspaceId: updateBoardDto.workspaceId,
        backgroundImageUrl: updateBoardDto.backgroundImageUrl,
      } as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.board.delete({ where: { id } });
  }

  async rotateShareToken(id: string) {
    await this.findOne(id);
    const token = randomBytes(18).toString('base64url');
    return this.prisma.board.update({
      where: { id },
      data: { shareToken: token } as any,
    });
  }

  async disableShareToken(id: string) {
    await this.findOne(id);
    return this.prisma.board.update({
      where: { id },
      data: { shareToken: null } as any,
    });
  }

  /**
   * Idempotently adds the calling user to a board reached via shared link.
   * - Workspace owners pass through (they already have implicit access).
   * - Existing members are returned as-is.
   * - New users are added with `Member` rights (sane default for an
   *   unsolicited join via link).
   */
  async joinViaShareToken(token: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { shareToken: token } as any,
      include: { workspace: { select: { userId: true } } },
    });
    if (!board) throw new NotFoundException('Shared board not found');

    if (board.workspace.userId === userId) return board;

    const existing = await this.prisma.userBoard.findFirst({
      where: { boardId: board.id, userId },
    });
    if (existing) return board;

    await this.prisma.userBoard.create({
      data: {
        boardId: board.id,
        userId,
        invitedUserRights: 'Member',
      },
    });
    return board;
  }
}
