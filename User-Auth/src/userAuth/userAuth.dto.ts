import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEmail, IsArray } from "class-validator";

export class stylistRegisterDto {
    @IsNotEmpty()
    @IsString()
    country_code: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsString()
    firstname: string;

    @IsNotEmpty()
    @IsString()
    lastname: string;

    @IsOptional()
    @IsString()
    middlename: string;

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    gender: string;

    @IsOptional()
    @IsString()
    dob: string;

    @IsOptional()
    @IsString()
    player_id: string;

    @IsOptional()
    @IsArray()
    tags: [];

    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsNotEmpty()
    @IsString()
    specialization: string;

    @IsNotEmpty()
    @IsString()
    experience: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    city: string

    @IsOptional()
    @IsString()
    state: string

    @IsOptional()
    @IsString()
    zip_code: string;

    @IsOptional()
    @IsString()
    ssn_number: string;

    @IsOptional()
    @IsString()
    cosmetology_license: string

    @IsOptional()
    @IsString()
    driving_license: string

    @IsNumber()
    @IsOptional()
    contractor: number

    @IsNumber()
    @IsOptional()
    liability_waiver: number

    @IsNumber()
    @IsOptional()
    privacy_policy: number

    @IsNumber()
    @IsOptional()
    terms_condition: number

    @IsNotEmpty()
    @IsString()
    lat: string

    @IsNotEmpty()
    @IsString()
    lng: string

    @IsNotEmpty()
    @IsString()
    device_type: string

    @IsNotEmpty()
    @IsString()
    device_token: string
}

export class stylistLoginDto {

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsNotEmpty()
    @IsOptional()
    hash: string
}

export class stylistVerifyOTPConfirmDto {

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsNotEmpty()
    @IsString()
    device_token: string

    @IsOptional()
    @IsString()
    device_type: string

    @IsOptional()
    @IsString()
    player_id: string

    @IsNotEmpty()
    @IsArray()
    tags: [];
}

export class stylistCheckPhoneNumberDto {

    @IsNotEmpty()
    @IsString()
    type: string

    @IsEmail()
    @IsOptional()
    email: string

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsOptional()
    @IsString()
    hash: string
}

export class checkStylistStatusDto {
    @IsNotEmpty()
    @IsString()
    stylist_id: string
}

export class customerRegisterDto {
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsString()
    firstname: string

    @IsNotEmpty()
    @IsString()
    lastname: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    lat: string

    @IsOptional()
    @IsString()
    lng: string

    @IsOptional()
    @IsString()
    gender: string

    @IsOptional()
    @IsString()
    dob: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsOptional()
    @IsString()
    device_type: string

    @IsOptional()
    @IsString()
    device_token: string
}

export class customerLoginDto {

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsNotEmpty()
    @IsOptional()
    hash: string

}

export class customerVerifyOTPConfirmDto {

    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsNotEmpty()
    @IsString()
    token: string

    @IsOptional()
    @IsString()
    device_token: string

    @IsOptional()
    @IsString()
    device_type: string

    @IsOptional()
    @IsString()
    player_id: string

    @IsNotEmpty()
    @IsArray()
    tags: [];
}

export class customerLoginWithPassword {
    @IsNotEmpty()
    @IsString()
    phone_number: string

    @IsNotEmpty()
    @IsString()
    country_code: string

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    device_type: string

    @IsOptional()
    @IsString()
    device_token: string
}

export class adminRegisterDto {
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsOptional()
    mobile_no: string
}

export class adminLoginDto {
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsEmail()
    email: string
}

export class adminVerifyDto {
    @IsNotEmpty()
    @IsString()
    authy_id: string

    @IsOptional()
    @IsString()
    token: string
}

export class adminForgotPasswordDto {

    @IsNotEmpty()
    @IsEmail()
    email: string

}

export class adminResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsEmail()
    email: string
}

export class enableDisableAdminDto {
    @IsNotEmpty()
    @IsString()
    admin_id: string

    @IsNotEmpty()
    @IsString()
    status: string
}

export class enableDisableStylistDto {
    @IsNotEmpty()
    @IsString()
    stylist_id: string

    @IsNotEmpty()
    @IsString()
    status: string
}

export class enableDisableCustomerDto {
    @IsNotEmpty()
    @IsString()
    customer_id: string

    @IsNotEmpty()
    @IsString()
    status: string
}

export class checkUserStatusDto {

    @IsOptional()
    @IsString()
    user_type: string

    @IsOptional()
    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    phone_number: string

    @IsOptional()
    @IsString()
    country_code: string

}