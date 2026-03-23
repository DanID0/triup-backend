import { Priority } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
export class CreateTaskDto {
    
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description: string;
    dueDate:string;

    @IsUUID()
    columnId: string;

    @IsUUID()
    @IsOptional()
    asignee: string;
    

    @IsOptional()
    @IsEnum(Priority)
    priority: Priority;

    


}



