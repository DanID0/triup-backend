import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { InvitedUserRights } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(InvitedUserRights)
  rights?: InvitedUserRights;
}

class UpdateMemberDto {
  @IsEnum(InvitedUserRights)
  rights!: InvitedUserRights;
}

@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/members')
export class BoardMembersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Param('boardId') boardId: string) {
    return this.prisma.userBoard.findMany({
      where: { boardId },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  async add(@Param('boardId') boardId: string, @Body() dto: AddMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No user with that email');
    }

    const existing = await this.prisma.userBoard.findFirst({
      where: { userId: user.id, boardId },
    });
    if (existing) {
      throw new BadRequestException('User already a member of this board');
    }

    return this.prisma.userBoard.create({
      data: {
        boardId,
        userId: user.id,
        invitedUserRights: dto.rights ?? 'Member',
      },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }

  @Patch(':memberId')
  async update(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const member = await this.prisma.userBoard.findUnique({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Member not found');
    }
    return this.prisma.userBoard.update({
      where: { id: memberId },
      data: { invitedUserRights: dto.rights },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }

  @Delete(':memberId')
  async remove(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
  ) {
    const member = await this.prisma.userBoard.findUnique({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Member not found');
    }
    return this.prisma.userBoard.delete({ where: { id: memberId } });
  }
}
