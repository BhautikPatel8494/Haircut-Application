import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class AddServiceToCartDto {
    @IsNotEmpty()
    @IsString()
    type: string;

    @IsNotEmpty()
    @IsString()
    service_id: string

    @IsNotEmpty()
    @IsNumber()
    quantity: number

    @IsString()
    @IsOptional()
    location_id: string

    @IsString()
    @IsOptional()
    stylist_type: string

    @IsNotEmpty()
    @IsString()
    profile_id: string

    @IsString()
    @IsOptional()
    stylist_id: string

    @IsString()
    @IsOptional()
    service_category_id: string

    @IsString()
    @IsNotEmpty()
    title: string

    @IsNumber()
    @IsOptional()
    sale_price: number

    @IsNumber()
    @IsOptional()
    regular_price: number

    @IsString()
    @IsNotEmpty()
    firstname: string

    @IsString()
    @IsNotEmpty()
    lastname: string

    @IsString()
    @IsNotEmpty()
    user_type: string

    @IsString()
    @IsOptional()
    profile: string

}

export class UpdateCartItemDto {
    @IsString()
    @IsNotEmpty()
    profile_id: string;

    @IsString()
    @IsOptional()
    cart_item_id: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number

    @IsNumber()
    @IsNotEmpty()
    price: number
}