import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserDto {
    @IsNotEmpty()
    firstname: string

    @IsNotEmpty()
    lastname: string

    @IsEmail()
    email: string

    @IsNotEmpty()
    phone_number: string

    @IsOptional()
    country_code: string

    @IsOptional()
    gender: string

    @IsOptional()
    dob: Date
}