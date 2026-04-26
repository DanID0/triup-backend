import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BoardActivityService } from './board-activity.service';

const USER_PUBLIC = { select: { id: true, username: true, email: true, avatarUrl: true } } as const;

const TASK_INCLUDE = {
  assignee: USER_PUBLIC,
  comments: {
    include: { user: USER_PUBLIC },
    orderBy: { createdAt: 'asc' },
  },
} as const;

@Injectable()
export class BoardsService {
  constructor(
    private prisma: PrismaService,
    private readonly activity: BoardActivityService,
  ) {}

  async create(createBoardDto: CreateBoardDto, userId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: createBoardDto.workspaceId },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.userId !== userId) {
      throw new ForbiddenException('Only the workspace owner can add boards here');
    }
    return this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        workspaceId: createBoardDto.workspaceId,
      },
    });
  }

  findAllByWorkspace(workspaceId: string) {
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
  }

  async findAllForUser(workspaceId: string, userId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.userId === userId) {
      return this.findAllByWorkspace(workspaceId);
    }
    if (ws.accessType === 'Privates') {
      return this.prisma.board.findMany({
        where: { workspaceId, UserBoard: { some: { userId } } },
        include: { columns: { orderBy: { position: 'asc' } } },
      });
    }
    const uw = await this.prisma.userWorkspace.findFirst({
      where: { workspaceId, userId },
    });
    if (uw) return this.findAllByWorkspace(workspaceId);
    const onBoard = await this.prisma.userBoard.findFirst({
      where: { userId, board: { workspaceId } },
    });
    if (onBoard) return this.findAllByWorkspace(workspaceId);
    throw new ForbiddenException('You do not have access to this workspace');
  }

  private async loadOne(id: string) {
    return this.prisma.board.findUnique({
      where: { id },
      include: {
        workspace: { include: { user: USER_PUBLIC } },
        columns: {
          orderBy: { position: 'asc' } as const,
          include: {
            tasks: { include: TASK_INCLUDE as any, orderBy: { createdAt: 'asc' } },
          },
        },
        UserBoard: {
          include: { user: USER_PUBLIC },
        },
      },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const board = await this.loadOne(id);
    if (!board) throw new NotFoundException(`Board ${id} not found`);
    const wid = board.workspaceId;
    const ownerId = board.workspace.userId;
    if (ownerId === userId) return board;
    const m = await this.prisma.userBoard.findFirst({ where: { boardId: id, userId } });
    if (m) return board;
    if (board.workspace.accessType === 'Privates') {
      throw new ForbiddenException('This board is in a private workspace');
    }
    const uw = await this.prisma.userWorkspace.findFirst({
      where: { userId, workspaceId: wid },
    });
    if (uw) return board;
    throw new ForbiddenException('You do not have access to this board');
  }

  async findByShareToken(token: string) {
    const board = await this.prisma.board.findUnique({
      where: { shareToken: token } as any,
      include: {
        workspace: { include: { user: USER_PUBLIC } },
        columns: {
          orderBy: { position: 'asc' } as const,
          include: {
            tasks: { include: TASK_INCLUDE as any, orderBy: { createdAt: 'asc' } },
          },
        },
        UserBoard: {
          include: { user: USER_PUBLIC },
        },
      },
    });
    if (!board) throw new NotFoundException('Shared board not found');
    if (board.workspace.accessType === 'Privates') {
      throw new ForbiddenException('Link sharing is disabled for private workspaces');
    }
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string) {
    await this.assertCanManageBoard(id, userId);
    const before = await this.prisma.board.findUnique({
      where: { id },
      select: { id: true, name: true, backgroundImageUrl: true },
    });
    if (!before) throw new NotFoundException(`Board ${id} not found`);

    const updated = await this.prisma.board.update({
      where: { id },
      data: {
        name: updateBoardDto.name,
        workspaceId: updateBoardDto.workspaceId,
        backgroundImageUrl: updateBoardDto.backgroundImageUrl,
      } as any,
    });

    if (updateBoardDto.name !== undefined && updateBoardDto.name !== before.name) {
      await this.activity.log({
        boardId: id,
        userId,
        type: 'BOARD_UPDATED',
        message: `renamed board from "${before.name}" to "${updateBoardDto.name}"`,
      });
    }
    if (
      updateBoardDto.backgroundImageUrl !== undefined &&
      updateBoardDto.backgroundImageUrl !== before.backgroundImageUrl
    ) {
      await this.activity.log({
        boardId: id,
        userId,
        type: 'BOARD_UPDATED',
        message: updateBoardDto.backgroundImageUrl
          ? 'changed board background'
          : 'cleared board background',
      });
    }
    return updated;
  }

  async remove(id: string, userId: string) {
    await this.assertCanManageBoard(id, userId);
    return this.prisma.board.delete({ where: { id } });
  }

  async rotateShareToken(id: string, userId: string) {
    await this.assertCanManageBoard(id, userId);
    const board = await this.prisma.board.findUnique({
      where: { id },
      select: { workspace: { select: { accessType: true } } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.workspace.accessType === 'Privates') {
      throw new ForbiddenException('Link sharing is disabled for private workspaces');
    }
    const token = randomBytes(18).toString('base64url');
    return this.prisma.board.update({
      where: { id },
      data: { shareToken: token } as any,
    });
  }

  async disableShareToken(id: string, userId: string) {
    await this.assertCanManageBoard(id, userId);
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
      include: { workspace: { select: { userId: true, accessType: true } } },
    });
    if (!board) throw new NotFoundException('Shared board not found');

    const full = () => this.loadOne(board.id);

    if (board.workspace.userId === userId) {
      const b = await full();
      if (!b) throw new NotFoundException('Board not found');
      return b;
    }

    const existing = await this.prisma.userBoard.findFirst({
      where: { boardId: board.id, userId },
    });
    if (existing) {
      const b = await full();
      if (!b) throw new NotFoundException('Board not found');
      return b;
    }

    if (board.workspace.accessType === 'Privates') {
      throw new ForbiddenException(
        'Only the workspace owner can add people to boards in a private workspace',
      );
    }

    await this.prisma.userBoard.create({
      data: {
        boardId: board.id,
        userId,
        invitedUserRights: 'Member',
      },
    });
    await this.activity.log({
      boardId: board.id,
      userId,
      type: 'BOARD_UPDATED',
      message: 'joined this board via invite link',
    });
    const b = await full();
    if (!b) throw new NotFoundException('Board not found');
    return b;
  }

  private async assertCanManageBoard(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, workspace: { select: { userId: true } } },
    });
    if (!board) throw new NotFoundException(`Board ${boardId} not found`);
    if (board.workspace.userId === userId) return;

    const membership = await this.prisma.userBoard.findFirst({
      where: { boardId, userId },
      select: { invitedUserRights: true },
    });
    if (!membership || membership.invitedUserRights !== 'Admin') {
      throw new ForbiddenException('Only board admins or the owner can manage board settings');
    }
  }

  async getActivityForUser(boardId: string, userId: string) {
    await this.findOneForUser(boardId, userId);
    try {
      return await this.activity.listForBoard(boardId, 300);
    } catch {
      // Fallback for environments where BoardActivity migration is not yet applied.
      return this.buildFallbackActivityFromComments(boardId);
    }
  }

  private async buildFallbackActivityFromComments(boardId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { task: { column: { boardId } } },
      include: {
        user: USER_PUBLIC,
        task: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return comments.map((c) => ({
      id: `fallback-comment-${c.id}`,
      boardId,
      userId: c.userId,
      type: 'COMMENT',
      message: `commented on "${c.task?.name || 'task'}"`,
      meta: {
        commentId: c.id,
        commentPreview: c.content.slice(0, 160),
      },
      createdAt: c.createdAt,
      user: c.user,
    }));
  }
}
