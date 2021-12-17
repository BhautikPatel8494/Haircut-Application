import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateRatingDto {
    @IsOptional()
    @IsString()
    user_id: string;

    @IsOptional()
    @IsString()
    stylist_id: string;

    @IsOptional()
    @IsString()
    custom_service_id: string;

    @IsOptional()
    @IsString()
    order_type: string;

    @IsOptional()
    @IsString()
    service_id: string;

    @IsNotEmpty()
    @IsNumber()
    value: number

    @IsNotEmpty()
    @IsNumber()
    rating_type: number

    @IsOptional()
    @IsString()
    message: string
}