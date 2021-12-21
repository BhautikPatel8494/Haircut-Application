import { IsOptional, IsString } from "class-validator";

export class JwtPlayload {
    @IsOptional()
    @IsString()
    _id: string;
}

export class CurrentUserDto {
    @IsOptional()
    @IsString()
    _id: string
}