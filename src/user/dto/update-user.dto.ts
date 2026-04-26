import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Language } from '@prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(Language)
  interfaceLanguage?: Language;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(7)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  oldPassword?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
