import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('workspace/:workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.boardsService.findAll(workspaceId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(id, updateBoardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  enableShare(@Param('id') id: string) {
    return this.boardsService.rotateShareToken(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/share')
  disableShare(@Param('id') id: string) {
    return this.boardsService.disableShareToken(id);
  }
}
