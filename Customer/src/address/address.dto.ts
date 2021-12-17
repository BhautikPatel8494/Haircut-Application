import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAddressDto {
    @IsOptional()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    address_type: string;

    @IsNotEmpty()
    @IsString()
    lat: string;

    @IsNotEmpty()
    @IsString()
    lng: string;

    @IsOptional()
    @IsString()
    location: {
        type: string;
        coordinates: []
    };

    @IsOptional()
    @IsString()
    country: string

    @IsOptional()
    @IsString()
    country_code: string

    @IsOptional()
    @IsString()
    state: string

    @IsOptional()
    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    zip_code: string;

    @IsOptional()
    @IsBoolean()
    active: boolean;

    @IsOptional()
    @IsString()
    address_id: string;
}

export class DeleteAddressDto {
    @IsNotEmpty()
    @IsString()
    address_id: string;
}

export class ActivateAddressDto {
    @IsNotEmpty()
    @IsString()
    address_id: string;

    @IsNotEmpty()
    @IsBoolean()
    active: boolean
}