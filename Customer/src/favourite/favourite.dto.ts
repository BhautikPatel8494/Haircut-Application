import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateFavouriteDto {
    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsOptional()
    stylist_id: string;

    @IsString()
    @IsOptional()
    service_id: string;

    @IsNumber()
    @IsNotEmpty()
    type: number
}

export class RemoveStylistOrService {
    @IsOptional()
    @IsString()
    service_id: string;

    @IsOptional()
    @IsString()
    stylist_id: string;
}