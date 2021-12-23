import { config } from "dotenv";
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe'

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerTransactions } from '../schema/customerTransaction.schema';
import { CapturePaymentDto, CreateChargeDirectOrderDto, CreateChargeDto, CreatePaymentTransactionDto, CreateTransactionDto, RefundPaymentDto } from '../bookingOrder/bookingOrder.dto';
config();

export class PaymentHandlerService {
    constructor(
        @InjectModel('CustomerTransaction') private readonly customerTransactionModel: Model<CustomerTransactions>
    ) { }

    async refundPayment(data: RefundPaymentDto) {
        try {
            const stripeData = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
            return await stripeData.refunds.create({
                charge: data.transactionId,
                amount: data.refundAmount
            });
        } catch (err) {
            return err;
        }
    }

    async createCharge(data: CreateChargeDto) {
        try {
            const stripeData = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
            return await stripeData.charges.create({
                amount: data.amount,
                currency: 'usd',
                customer: data.customerId,
            });
        } catch (err) {
            throw new BadRequestException(err)
        }
    }


    async createChargeDirectOrder(data: CreateChargeDirectOrderDto) {
        try {
            const stripeData = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
            return stripeData.charges.create({
                amount: data.amount,
                currency: 'usd',
                customer: data.customerId,
            });
        } catch (err) {
            return err
        }
    }

    async capturePayment(data: CapturePaymentDto) {
        try {
            const stripeData = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
            return await stripeData.charges.capture(data.chargeId);
        } catch (err) {
            return err;
        }
    }

    async createTransaction(data: CreateTransactionDto) {
        try {
            return await this.customerTransactionModel.create({
                user_id: data.user_id,
                amount: data.amount,
                message: data.message,
                type: 'order-deduction',
                transaction_type: 'deduction',
            });
        } catch (err) {
            return err
        }
    }

    async createPaymentTransaction(data: CreatePaymentTransactionDto) {
        try {
            return await this.customerTransactionModel.create({
                user_id: data.user_id,
                amount: data.amount,
                message: data.message,
                type: 'payment',
                transaction_type: 'deduction',
            });
        } catch (err) {
            return err;
        }
    }
}