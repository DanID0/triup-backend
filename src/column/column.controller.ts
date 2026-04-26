import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('column')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Post()
  create(@Body() createColumnDto: CreateColumnDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.columnService.create(createColumnDto, userId);
  }

  @Get()
  findAllByBoard(@Query('boardId') boardId: string) {
    return this.columnService.findAllByBoard(boardId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.columnService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateColumnDto: UpdateColumnDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.columnService.update(id, updateColumnDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.columnService.remove(id, userId);
  }
}
