import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaService } from 'src/prisma/prisma.service';
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
    });
  }

  findOne(id: string) {
    return this.prisma.board.findUnique({
      where: {id},
    })
  }

  update(id: number, updateBoardDto: UpdateBoardDto) {
    return this;
  }

  remove(id: number) {
    return `This action removes a #${id} board`;
  }
}
