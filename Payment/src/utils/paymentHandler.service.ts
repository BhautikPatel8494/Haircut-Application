import stripe from 'stripe'
import { config } from "dotenv";
import { BadRequestException } from '@nestjs/common';

import { CreateChargeDto, CreateCustomerDto, DeleteCardDto, RefundPaymentDto } from '../payment/payment.dto';
config();

export class PaymentHandlerService {
    async refundPaymentHandler(data: RefundPaymentDto) {
        try {
            const stripeData = new stripe(process.env.STRIPE_SANDBOX_KEY, {
                apiVersion: '2020-08-27'
            });
            const refundInfo = await stripeData.refunds.create({
                charge: data.transactionId,
                amount: data.refundAmount
            });
            if (refundInfo) {
                return refundInfo
            } else {
                throw new BadRequestException('Something went wrong');
            }
        } catch (err) {
            throw new BadRequestException(err);
        }
    }

    async transferToConnectedAccount(data, callback) {
        const stripe = require("stripe")(process.env.STRIPE_SANDBOX_KEY);
        return await stripe.transfers.create({
            amount: data.amount,
            currency: data.currency,
            destination: data.destination,
            transfer_group: data.transfer_group,
        }, callback);
    }

    async createCharge(data: CreateChargeDto) {
        try {
            const stripeData = new stripe(process.env.STRIPE_SANDBOX_KEY, {
                apiVersion: '2020-08-27'
            });
            const chargeInfo = await stripeData.charges.create({
                amount: data.amount,
                currency: 'usd',
                customer: data.customerId,
            });
            if (chargeInfo) {
                return chargeInfo
            } else {
                throw new BadRequestException('Something went wrong');
            }
        } catch (err) {
            throw new BadRequestException(err)
        }
    }

    async createCustomer(data: CreateCustomerDto) {
        try {
            const stripeData = new stripe(process.env.STRIPE_SANDBOX_KEY, {
                apiVersion: '2020-08-27'
            });
            const stripeInfo = await stripeData.customers.create({
                source: data.source,
                email: data.email
            });                 
            if (stripeInfo) {
                return stripeInfo
            } else {
                throw new BadRequestException('Something went wrong');
            }
        } catch (err) {
            console.log(`err`, err)
            throw new BadRequestException(err);
        }
    }

    async deleteCustomer(data: DeleteCardDto) {
        try {
            const stripeData = new stripe(process.env.STRIPE_SANDBOX_KEY, {
                apiVersion: '2020-08-27'
            });
            const deletedCustomer = await stripeData.customers.del(
                data.customerId
            );
            if (deletedCustomer) {
                return {
                    deletedCustomer
                }
            } else {
                throw new BadRequestException('Something went wrong');
            }
        } catch (err) {
            throw new BadRequestException(err.message);
        }
    }
}