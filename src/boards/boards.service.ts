import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  create(createBoardDto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        name: createBoardDto.name,workspaceId: createBoardDto.workspaceId,
      },
    });
  }

  findAll(workspaceId: string) {
    return this.prisma.board.findMany({
      where: { workspaceId }, include: { columns: { orderBy: { position: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },include: { columns: { orderBy: { position: 'asc' }, include: { tasks: true } } },
    });
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({
      where: { id },
      data: {name: updateBoardDto.name,
      workspaceId: updateBoardDto.workspaceId,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.board.delete({ where: { id } });
  }
}
