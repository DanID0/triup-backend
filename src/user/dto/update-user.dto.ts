import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {

    @IsEnum(Language)
    interfaceLanguage: Language;
}
