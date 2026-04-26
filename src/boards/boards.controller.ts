import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  // Public route – accessible without auth (for shared links)
  @Get('public/:shareToken')
  findByShareToken(@Param('shareToken') shareToken: string) {
    return this.boardsService.findByShareToken(shareToken);
  }

  // Authenticated route called when a logged-in user lands on a shared link.
  // Adds them to the board as a Member if they aren't already, then returns
  // the board so the client can navigate to its regular page.
  @UseGuards(JwtAuthGuard)
  @Post('public/:shareToken/join')
  joinViaShareToken(
    @Param('shareToken') shareToken: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.boardsService.joinViaShareToken(shareToken, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createBoardDto: CreateBoardDto,
    @Req() req: Request,
  ) {
    return this.boardsService.create(
      createBoardDto,
      (req.user as { id: string }).id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('workspace/:workspaceId')
  findAllByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Req() req: Request,
  ) {
    return this.boardsService.findAllForUser(
      workspaceId,
      (req.user as { id: string }).id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.boardsService.findOneForUser(id, (req.user as { id: string }).id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/activity')
  getActivity(@Param('id') id: string, @Req() req: Request) {
    return this.boardsService.getActivityForUser(id, (req.user as { id: string }).id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.boardsService.update(id, updateBoardDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.boardsService.remove(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  enableShare(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.boardsService.rotateShareToken(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/share')
  disableShare(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.boardsService.disableShareToken(id, userId);
  }
}
