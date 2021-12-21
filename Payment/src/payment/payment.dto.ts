import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class RefundPaymentDto {
    @IsOptional()
    @IsString()
    transactionId: string;

    @IsOptional()
    @IsNumber()
    refundAmount: number
}

export class CreateChargeDto {
    @IsOptional()
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    customerId: string;
}

export class CreateCustomerDto {
    @IsOptional()
    @IsString()
    userId: string;

    @IsOptional()
    @IsString()
    email: string;
}

export class DeleteCardDto {
    @IsOptional()
    @IsString()
    customerId: string;
}

export class StripeAccountDto {
    @IsNotEmpty()
    @IsString()
    stylist_id: string;

    @IsOptional()
    @IsString()
    business_type: string;

    @IsOptional()
    @IsString()
    business_profile_product_description: string;

    @IsOptional()
    @IsString()
    company_registration_number: number;

    @IsOptional()
    @IsString()
    company_vat_id: number;

    @IsOptional()
    @IsString()
    external_account_routing_number: number;

    @IsOptional()
    @IsString()
    external_account_account_number: number;
}

export class GetStripeAccountDto {
    @IsNotEmpty()
    @IsString()
    stylist_id: string;
}

export class PayoutToStylistDto {
    @IsNotEmpty()
    @IsString()
    stylist_id: string

    @IsNotEmpty()
    @IsNumber()
    amount: number
}

export class AddCardDto {
    @IsNotEmpty()
    @IsString()
    customerId: string;

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsNotEmpty()
    @IsNumber()
    lastd: number;

    @IsNotEmpty()
    @IsString()
    exp_year: string;

    @IsNotEmpty()
    @IsString()
    exp_month: string;

    @IsNotEmpty()
    @IsString()
    holder_name: string;

    @IsNotEmpty()
    @IsString()
    zip_code: string
}

export class UpdateCardDto {
    @IsNotEmpty()
    @IsString()
    card_id: string;

    @IsNotEmpty()
    @IsString()
    holder_name: string;
}

export class PayToStylistDto {
    @IsNotEmpty()
    @IsString()
    customer_id: string;

    @IsNotEmpty()
    @IsString()
    stylist_id: string;

    @IsNotEmpty()
    @IsString()
    order_id: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;
}

export class RefundAmountDto {
    @IsNotEmpty()
    @IsString()
    order_id: string;

    @IsNotEmpty()
    @IsNumber()
    deducted_amount: number;

    @IsNotEmpty()
    @IsString()
    message: string;
}

export class CancelChargeDto {
    @IsNotEmpty()
    @IsString()
    order_id: string;

    @IsNotEmpty()
    @IsString()
    person_type: string;

    @IsNotEmpty()
    @IsString()
    timing: string;

    @IsOptional()
    @IsString()
    message: string;
}

export class EmergencyCancelDto {
    @IsNotEmpty()
    @IsString()
    reason_id: string;

    @IsNotEmpty()
    @IsString()
    order_id: string;
}