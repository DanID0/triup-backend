import { Injectable } from '@nestjs/common';
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

  findAll(id: string) {
    return this.prisma.workspace.findMany(
    {
      where: {
        id: id,
      },
    }
    );
    
  }

  findOne(id: string) {
      return this.prisma.workspace.findUnique({
        where: {
          id: id,
        },
      });
  }

  update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    return `This action updates a #${id} workspace`;
  }

  remove(id: string) {
    return `This action removes a #${id} workspace`;
  }
}
