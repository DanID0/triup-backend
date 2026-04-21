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
        user: { select: { id: true, username: true } },
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        OR: [
          { userId },
          { UserWorkspace: { some: { userId } } },
        ],
      },
      include: {
        Boards: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        Boards: true,
        user: { select: { id: true, username: true } },
        UserWorkspace: { select: { userId: true } },
      },
    });
    if (!workspace)
      throw new NotFoundException(`Workspace with id ${id} not found`);
    this.assertAccess(workspace, userId);
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
        user: { select: { id: true, username: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.workspace.delete({ where: { id } });
  }

  private assertAccess(
    workspace: { userId: string; UserWorkspace: { userId: string }[] },
    userId: string,
  ) {
    const isOwner = workspace.userId === userId;
    const isMember = workspace.UserWorkspace.some(
      (m) => m.userId === userId,
    );
    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
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
