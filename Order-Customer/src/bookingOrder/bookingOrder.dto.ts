import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CancleOrderDto {
    @IsNotEmpty()
    @IsString()
    order_id: string;

    @IsOptional()
    @IsNumber()
    service_type: number;

    @IsOptional()
    @IsString()
    user_type: string;

    @IsOptional()
    @IsString()
    reason: string;
}

export class ChangeStatusDto {
    @IsString()
    @IsOptional()
    order_id: string;

    @IsString()
    @IsOptional()
    stylist_id: string;

    @IsNumber()
    @IsOptional()
    status: string;
}

export class ConfirmOtpServiceDto {
    @IsOptional()
    @IsString()
    booking_id: string;

    @IsString()
    @IsOptional()
    stylist_id: string;

    @IsString()
    @IsOptional()
    otp: string;
}

export class CreateOrderDto {

    @IsOptional()
    @IsNumber()
    convenience_fee: number;

    @IsOptional()
    @IsNumber()
    service_charges: number

    @IsOptional()
    @IsNumber()
    tax: number

    @IsOptional()
    @IsNumber()
    discount: number

    @IsOptional()
    @IsNumber()
    voucher: number

    @IsOptional()
    @IsNumber()
    total_bills: number

    @IsOptional()
    @IsNumber()
    voucher_amount: number

    @IsOptional()
    @IsNumber()
    wallet_amount_used: number

    @IsOptional()
    @IsNumber()
    card_amount_used: number

    @IsString()
    cart_id: string

    @IsOptional()
    @IsString()
    from_time: string

    @IsOptional()
    @IsString()
    to_time: string

    @IsString()
    stylist_id: string

    @IsOptional()
    @IsNumber()
    booking_type: number

    @IsOptional()
    @IsString()
    date: string

    @IsOptional()
    @IsBoolean()
    wallet_used: boolean

    @IsString()
    stripe_customer_id: string

}

export class CreateDirectOrderDto {
    @IsOptional()
    @IsNumber()
    convenience_fee: number;

    @IsOptional()
    @IsNumber()
    service_charges: number;

    @IsOptional()
    @IsNumber()
    tax: number;

    @IsOptional()
    @IsNumber()
    discount: number;

    @IsOptional()
    @IsNumber()
    voucher: number;

    @IsOptional()
    @IsNumber()
    total_bills: number;

    @IsOptional()
    @IsNumber()
    voucher_amount: number;

    @IsOptional()
    @IsNumber()
    wallet_amount_used: number;

    @IsOptional()
    @IsNumber()
    card_amount_used: number;

    @IsString()
    cart_id: string;

    @IsOptional()
    @IsString()
    from_time: string;

    @IsOptional()
    @IsString()
    to_time: string;

    @IsNotEmpty()
    @IsString()
    stylist_id: string;

    @IsOptional()
    @IsString()
    booking_type: string;

    @IsOptional()
    @IsString()
    date: string;

    @IsString()
    stripe_customer_id: string;
}

export class FilterDto {
    @IsString()
    @IsOptional()
    stylist_id: string;

    @IsString()
    @IsOptional()
    date: string;

    @IsString()
    @IsOptional()
    start_time: string;

    @IsString()
    @IsOptional()
    end_time: string;
}

export class RebookingOrderDto {
    @IsOptional()
    @IsString()
    order_id: string;

    @IsOptional()
    @IsString()
    stripe_customer_id: string;

    @IsOptional()
    @IsString()
    date: string;

    @IsOptional()
    @IsString()
    from_time: string;

    @IsOptional()
    @IsString()
    to_time: string;
}

export class CreateTransactionDto {
    @IsOptional()
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    amount: number;

    @IsOptional()
    @IsString()
    user_id: string;
}

export class CreatePaymentTransactionDto {
    @IsOptional()
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    amount: number;

    @IsOptional()
    @IsString()
    user_id: string;
}

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

export class CreateChargeDirectOrderDto {
    @IsOptional()
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    customerId: string;
}

export class CapturePaymentDto {
    @IsOptional()
    @IsString()
    chargeId: string;
}