import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ColumnService {
  constructor(private prisma: PrismaService) {}

  create(createColumnDto: CreateColumnDto) {
    return this.prisma.column.create({
      data: {
        name: createColumnDto.name,
        boardId: createColumnDto.boardId,
        color: createColumnDto.color,
        position: createColumnDto.position ?? 0,
      } as any,
    });
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

  async update(id: string, updateColumnDto: UpdateColumnDto) {
    await this.findOne(id);
    return this.prisma.column.update({
      where: { id },
      data: {
        name: updateColumnDto.name,
        color: updateColumnDto.color,
        position: updateColumnDto.position,
        boardId: updateColumnDto.boardId,
      } as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.column.delete({ where: { id } });
  }
}
