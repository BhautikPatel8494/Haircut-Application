import { IsOptional, IsString } from "class-validator";

export class CurrentUserDto {
    @IsOptional()
    @IsString()
    _id: string;
}