import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  backgroundImageUrl?: string | null;
}
