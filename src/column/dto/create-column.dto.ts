import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  boardId: string;

  @IsString()
  color: string;

  @IsInt()
  @IsOptional()
  position?: number;
}
