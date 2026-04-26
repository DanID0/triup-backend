import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  create(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    return this.prisma.workspace.create({
      data: {
        name: createWorkspaceDto.name,
        accessType: createWorkspaceDto.accessType,
        userId,
      },
      include: {
        Boards: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        OR: [
          { userId },
          {
            accessType: 'Public',
            OR: [
              { UserWorkspace: { some: { userId } } },
              {
                Boards: {
                  some: { UserBoard: { some: { userId } } },
                },
              },
            ],
          },
        ],
      },
      include: {
        Boards: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        Boards: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
        UserWorkspace: { select: { userId: true } },
      },
    });
    if (!workspace)
      throw new NotFoundException(`Workspace with id ${id} not found`);
    await this.assertAccess(workspace, userId);
    const { UserWorkspace: _members, ...rest } = workspace;
    return rest;
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
    userId: string,
  ) {
    await this.assertOwner(id, userId);
    return this.prisma.workspace.update({
      where: { id },
      data: {
        name: updateWorkspaceDto.name,
        accessType: updateWorkspaceDto.accessType,
      },
      include: {
        Boards: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.workspace.delete({ where: { id } });
  }

  private async assertAccess(
    workspace: {
      id: string;
      userId: string;
      accessType: string;
      UserWorkspace: { userId: string }[];
    },
    userId: string,
  ) {
    if (workspace.userId === userId) return;
    if (workspace.accessType === 'Privates') {
      throw new ForbiddenException('You do not have access to this workspace');
    }
    if (workspace.UserWorkspace.some((m) => m.userId === userId)) return;
    const boardAccess = await this.prisma.userBoard.findFirst({
      where: { userId, board: { workspaceId: workspace.id } },
    });
    if (boardAccess) return;
    throw new ForbiddenException('You do not have access to this workspace');
  }

  private async assertOwner(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, userId: true },
    });
    if (!workspace)
      throw new NotFoundException(
        `Workspace with id ${workspaceId} not found`,
      );
    if (workspace.userId !== userId) {
      throw new ForbiddenException('Only the workspace owner can do that');
    }
    return workspace;
  }
}
