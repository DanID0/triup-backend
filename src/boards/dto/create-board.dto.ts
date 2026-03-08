import { IsString, IsUUID } from "class-validator";
export class CreateBoardDto {
    @IsString()
    name: string;

    @IsUUID()
    workspaceId: string;
}
