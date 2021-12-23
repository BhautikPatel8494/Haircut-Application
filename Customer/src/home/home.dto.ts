import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCustomerTransactionDto {
    @IsOptional()
    @IsString()
    user_id: string;

    @IsOptional()
    @IsString()
    stripe_customer_id: string;

    @IsOptional()
    @IsNumber()
    amount: number;
}

export class FilterDto {
    @IsOptional()
    @IsString()
    user_id: string;

    @IsOptional()
    @IsString()
    stylist_id: string;

    @IsOptional()
    @IsString()
    order_id: string;

    @IsOptional()
    @IsString()
    category_id: string;

    @IsOptional()
    @IsString()
    subcategory_id: string;

    @IsOptional()
    @IsString()
    profile_id: string;

    @IsOptional()
    @IsString()
    service_id: string;

    @IsOptional()
    @IsString()
    custom_service_id: string;

    @IsOptional()
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsNumber()
    page: number;

    @IsOptional()
    @IsString()
    sort: string;

    @IsOptional()
    lat: any;

    @IsOptional()
    lng: any;

    @IsOptional()
    @IsString()
    filter: string;

    @IsOptional()
    @IsString()
    search: string;

    @IsOptional()
    @IsString()
    stylist_level: string;

    @IsOptional()
    @IsString()
    stylist_type: string;

    @IsOptional()
    @IsString()
    age_group: string;

    @IsOptional()
    @IsString()
    gender_filter: string;

    @IsOptional()
    @IsString()
    name_filter: string;

    @IsOptional()
    @IsString()
    rating_filter: string;
}

export class ServiceListDto {
    @IsOptional()
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsNumber()
    page: number;

    @IsOptional()
    @IsString()
    category_id: string;

    @IsOptional()
    @IsString()
    age_group: string;

    @IsNotEmpty()
    @IsString()
    profile_id: string;

    @IsNotEmpty()
    @IsString()
    country: string;

    @IsNotEmpty()
    @IsString()
    state_code: string;

    @IsOptional()
    @IsString()
    subcategory_id: string;

    @IsOptional()
    @IsString()
    stylist_level: string;
}