import { Injectable, NotFoundException } from '@nestjs/common';
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
        userId: userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { userId },
      include: { Boards: true },
    });
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: { Boards: true },
    });
    if (!workspace) throw new NotFoundException(`Workspace with id ${id} not found`);
    return workspace;
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    await this.findOne(id);
    return this.prisma.workspace.update({
      where: { id },
      data: {
        name: updateWorkspaceDto.name,
        accessType: updateWorkspaceDto.accessType,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workspace.delete({ where: { id } });
  }
}
