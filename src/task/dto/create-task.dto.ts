import { Priority } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  columnId: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}

