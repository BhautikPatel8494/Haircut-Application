import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class JwtPlayload {
    _id: string;
}

export class CurrentUserDto {
    @IsOptional()
    @IsString()
    _id: string;

    @IsOptional()
    @IsString()
    firstname: string;

    @IsOptional()
    @IsString()
    lastname: string;

    @IsOptional()
    @IsString()
    middlename: string;

    @IsOptional()
    @IsString()
    phone_number: string;
}

export class CreateFamilyMemberDto {
    @IsOptional()
    @IsString()
    _id: string;

    @IsOptional()
    @IsString()
    member_id: string

    @IsNotEmpty()
    @IsString()
    firstname: string;

    @IsNotEmpty()
    @IsString()
    lastname: string;

    @IsOptional()
    @IsString()
    profile: string;

    @IsNotEmpty()
    @IsString()
    dob: string;

    @IsNotEmpty()
    @IsString()
    relation: string;

    @IsOptional()
    @IsString()
    user_type: string;

    @IsOptional()
    default_profile: boolean;

    @IsOptional()
    @IsString()
    created_at: string;

    @IsOptional()
    @IsString()
    updated_at: string;
}


export class UpdateFamilyMemberDto {
    @IsOptional()
    @IsString()
    _id: string;

    @IsOptional()
    @IsString()
    firstname: string;

    @IsOptional()
    @IsString()
    lastname: string;

    @IsOptional()
    @IsString()
    profile: string;

    @IsOptional()
    @IsString()
    dob: string;

    @IsOptional()
    @IsString()
    relation: string;

    @IsOptional()
    @IsString()
    user_type: string;

    @IsOptional()
    @IsBoolean()
    default_profile: boolean;

    @IsOptional()
    @IsString()
    member_id: string
}

export class CommonMemberDto {
    @IsNotEmpty()
    @IsString()
    member_id: string;
}

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    firstname: string

    @IsNotEmpty()
    @IsString()
    lastname: string

    @IsEmail()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsOptional()
    @IsString()
    country_code: string

    @IsOptional()
    @IsString()
    gender: string

    @IsOptional()
    @IsString()
    dob: string
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstname: string

    @IsString()
    @IsOptional()
    lastname: string

    @IsEmail()
    @IsString()
    @IsOptional()
    email: string

    @IsString()
    @IsOptional()
    phone_number: string

    @IsString()
    @IsOptional()
    country_code: string

    @IsOptional()
    @IsString()
    gender: string

    @IsOptional()
    @IsString()
    dob: string
}