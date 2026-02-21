import { AccessType } from "@prisma/client";
import { IsEnum, IsString, IsUUID } from "class-validator";

export class CreateWorkspaceDto {

    @IsString()
    name: string;

    @IsEnum(AccessType)
    accessType: AccessType;


}
