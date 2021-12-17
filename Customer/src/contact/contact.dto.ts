import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateContactDto {
    @IsString()
    @IsOptional()
    user_id: string;

    @IsString()
    @IsOptional()
    type: string;

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNumber()
    @IsNotEmpty()
    phone_number: number

    @IsBoolean()
    @IsOptional()
    status: boolean

    @IsOptional()
    @IsString()
    contact_id: string;
}

export class DeleteContact {
    @IsNotEmpty()
    @IsString()
    contact_id: string;
}