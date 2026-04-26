import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
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
  async list(@Param('boardId') boardId: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    await this.assertBoardAccess(boardId, userId);

    const [members, board] = await Promise.all([
      this.prisma.userBoard.findMany({
        where: { boardId },
        include: {
          user: { select: { id: true, username: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.board.findUnique({
        where: { id: boardId },
        select: {
          createdAt: true,
          workspace: {
                select: {
                  user: {
                    select: { id: true, username: true, email: true, avatarUrl: true },
                  },
                },
          },
        },
      }),
    ]);

    if (!board?.workspace?.user) return members;
    const owner = board.workspace.user;
    const ownerMember = members.find((m) => m.userId === owner.id);
    if (ownerMember) {
      return members.map((m) =>
        m.userId === owner.id
          ? {
              ...m,
              invitedUserRights: 'Admin' as InvitedUserRights,
              isOwner: true,
            }
          : m,
      );
    }

    // Surface the workspace owner as a synthetic Admin entry so the UI can
    // display them alongside invited members. The id is namespaced so the
    // client knows it isn't a real UserBoard row.
    const ownerEntry = {
      id: `owner:${owner.id}`,
      userId: owner.id,
      boardId,
      invitedUserRights: 'Admin' as InvitedUserRights,
      createdAt: board.createdAt,
      updatedAt: board.createdAt,
      user: owner,
      isOwner: true,
    };
    return [ownerEntry, ...members];
  }

  @Post()
  async add(@Param('boardId') boardId: string, @Body() dto: AddMemberDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    await this.assertCanManageMembers(boardId, userId);

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
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
    });
  }

  @Patch(':memberId')
  async update(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string }).id;
    await this.assertCanManageMembers(boardId, userId);
    const member = await this.prisma.userBoard.findUnique({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Member not found');
    }
    return this.prisma.userBoard.update({
      where: { id: memberId },
      data: { invitedUserRights: dto.rights },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
    });
  }

  @Delete(':memberId')
  async remove(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string }).id;
    await this.assertCanManageMembers(boardId, userId);
    const member = await this.prisma.userBoard.findUnique({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Member not found');
    }
    return this.prisma.userBoard.delete({ where: { id: memberId } });
  }

  private async assertBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, workspace: { select: { userId: true } } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.workspace.userId === userId) return;

    const membership = await this.prisma.userBoard.findFirst({
      where: { boardId, userId },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('You do not have access to this board');
  }

  private async assertCanManageMembers(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, workspace: { select: { userId: true, accessType: true } } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.workspace.userId === userId) return;
    if (board.workspace.accessType === 'Privates') {
      throw new ForbiddenException('Only the workspace owner can manage private board members');
    }

    const membership = await this.prisma.userBoard.findFirst({
      where: { boardId, userId },
      select: { invitedUserRights: true },
    });
    if (!membership || membership.invitedUserRights !== 'Admin') {
      throw new ForbiddenException('Only board admins or the owner can manage members');
    }
  }
}
