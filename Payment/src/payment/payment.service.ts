import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import { FilterQuery, Model, Types } from 'mongoose';
import stripe from 'stripe'

import { PaymentHandlerService } from '../utils/paymentHandler.service';
import { ApiResponse } from '../utils/apiResponse.service';
import { Utility } from '../utils/utility.service';
import { BOOKING_TYPE, ORDER_STATUS } from '../utils/constant';
import { ServiceProviders } from '../schema/serviceProvider.schema';
import { ConnectedAccounts } from '../schema/connectedAccount.schema';
import { StylistTransfers } from '../schema/stylistTransfer.schema';
import { Users } from '../schema/user.schema';
import { Orders } from '../schema/order.schema';
import { CustomerTransactions } from '../schema/customerTransaction.schema';
import { CancellationRules } from '../schema/cancellationRule.schema';
import { EmergencyCancellations } from '../schema/emergencyCancellation.schema';
import { CurrentUserDto } from '../authentication/authentication.dto';
import { CancelChargeDto, EmergencyCancelDto, GetStripeAccountDto, PayoutToStylistDto, PayToStylistDto, UpdateCardDto } from './payment.dto';

const stripeData = new stripe(process.env.STRIPE_SANDBOX_KEY, {
  apiVersion: '2020-08-27'
})

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel("User") private readonly userModel: Model<Users>,
    @InjectModel("ServiceProvider") private readonly serviceProviderModel: Model<ServiceProviders>,
    @InjectModel("Order") private readonly orderModel: Model<Orders>,
    @InjectModel('ConnectedAccount') private readonly connectedAccountModel: Model<ConnectedAccounts>,
    @InjectModel('CustomerTransaction') private readonly cancellationRuleModel: Model<CancellationRules>,
    @InjectModel('CancellationRule') private readonly customerTransactionModel: Model<CustomerTransactions>,
    @InjectModel('EmergencyCancellation') private readonly emergencyCancellationModel: Model<EmergencyCancellations>,
    @InjectModel('StylistTransfer') private readonly stylistTransferModel: Model<StylistTransfers>,
    private readonly utility: Utility,
    private readonly paymentHandler: PaymentHandlerService,
    private readonly apiResponse: ApiResponse
  ) { }

  async stripeAccontSetup(setupAccount: Request, res: Response) {
    try {
      const { stylist_id, business_type, business_profile_product_description, company_registration_number, company_vat_id, external_account_routing_number, external_account_account_number } = setupAccount.body;

      const stylistData = await this.serviceProviderModel.findOne({ _id: stylist_id });
      if (!stylistData) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Stylist not present')
      }

      const email = stylistData.email ? stylistData.email : '';
      const profile_name = stylistData.full_name ? stylistData.full_name : '';
      const firstname = stylistData.firstname ? stylistData.firstname : '';
      const lastname = stylistData.lastname ? stylistData.lastname : '';
      const city = stylistData.city ? stylistData.city : '';
      const country = stylistData.country ? stylistData.country : 'US';
      const address_line1 = stylistData.address ? stylistData.address : '';
      const address_line2 = null
      const postal_code = stylistData.zip_code ? stylistData.zip_code : '';
      const state = stylistData.state ? stylistData.state : '';
      const phone_number = stylistData.phone_number ? stylistData.phone_number : '';
      const dob = stylistData.dob ? stylistData.dob : '';
      let ssn_number = stylistData.ssn_number ? stylistData.ssn_number : '';

      let last4digit = "";
      if (ssn_number) {
        ssn_number = ssn_number.toString().replace(/-/g, '');
        last4digit = ssn_number.substr(-4);
      }

      let createObj = {};
      const frontData: any = await this.utility.getS3File(stylistData.driving_license_image, 'instacuts/service_provider/driving_licence')
      const frontDocumentFile = await stripeData.files.create({
        purpose: 'identity_document',
        file: {
          data: frontData.Body,
          name: stylistData.driving_license_image,
        },
      })

      if (business_type == "company") {
        createObj = {
          type: 'custom',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: setupAccount.connection.remoteAddress,
          },
          business_profile: {
            mcc: '5045',
            name: profile_name,
            product_description: business_profile_product_description,
            support_address: {
              city: city,
              country: country,
              line1: address_line1,
              line2: address_line2,
              postal_code: postal_code,
              state: state
            },
            support_email: email,
            support_phone: phone_number,
            support_url: 'https://instacut.us/',
            url: 'https://instacut.us/'
          },
          business_type: 'company',
          company: {
            owners_provided: true,
            address: {
              city: city,
              country: country,
              line1: address_line1,
              line2: address_line2,
              postal_code: postal_code,
              state: state
            },
            name: profile_name,
            phone: phone_number,
            registration_number: company_registration_number,
            tax_id: company_registration_number,
            vat_id: company_vat_id,
          },
          external_account: {
            object: 'bank_account',
            country: 'US',
            currency: 'usd',
            routing_number: external_account_routing_number,
            account_number: external_account_account_number,
          }
        }
      } else {
        createObj = {
          type: 'custom',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: setupAccount.connection.remoteAddress,
          },
          business_profile: {
            mcc: '5045',
            name: profile_name,
            product_description: business_profile_product_description,
            support_address: {
              city: city,
              country: country,
              line1: address_line1,
              line2: address_line2,
              postal_code: postal_code,
              state: state
            },
            support_email: email,
            support_phone: phone_number,
            support_url: 'https://instacut.us/',
            url: 'https://instacut.us/'
          },
          business_type: 'individual',
          individual: {
            address: {
              city: city,
              country: country,
              line1: address_line1,
              line2: address_line2,
              postal_code: postal_code,
              state: state
            },
            dob: {
              day: new Date(dob).getDay(),
              month: new Date(dob).getMonth(),
              year: new Date(dob).getFullYear()
            },
            first_name: firstname,
            last_name: lastname,
            phone: phone_number,
            email: email,
            id_number: parseInt(ssn_number),
            ssn_last_4: parseInt(last4digit),
            verification: {
              document: {
                front: frontDocumentFile.id
              }
            }
          },
          external_account: {
            object: 'bank_account',
            country: 'US',
            currency: 'usd',
            routing_number: external_account_routing_number,
            account_number: external_account_account_number,
          }
        }
      }

      const accountCreateObj = await stripeData.accounts.create(createObj);
      if (business_type == "company") {
        const updateObj = await stripeData.accounts.createPerson(
          accountCreateObj.id,
          {
            address: {
              city: city,
              country: 'US',
              line1: address_line1,
              line2: address_line2,
              postal_code: postal_code,
              state: state
            },
            dob: {
              day: new Date(dob).getDay(),
              month: new Date(dob).getMonth(),
              year: new Date(dob).getFullYear()
            },
            email: email,
            first_name: firstname,
            id_number: ssn_number,
            last_name: lastname,
            relationship: {
              owner: true,
              representative: true,
              title: 'Executive'
            },
            phone: phone_number,
            verification: {
              document: {
                front: frontDocumentFile.id
              }
            }
          }
        );
        const accountInfo = await this.connectedAccountModel.findOne({ stylist_id: stylist_id });
        if (!accountInfo) {
          await this.connectedAccountModel.create({ stylist_id: stylist_id, stripe_data: updateObj })
        } else {
          await this.connectedAccountModel.updateOne({ stylist_id: stylist_id }, { $set: { stripe_data: updateObj } })
        }
        return this.apiResponse.successResponseWithData(res, 'Account linked successfully!', updateObj)
      } else {
        const accountInfo = await this.connectedAccountModel.findOne({ stylist_id: stylist_id });
        if (!accountInfo) {
          await this.connectedAccountModel.create({ stylist_id: stylist_id, stripe_data: accountCreateObj })
        } else {
          await this.connectedAccountModel.updateOne({ stylist_id: stylist_id }, { $set: { stripe_data: accountCreateObj } })
        }
        return this.apiResponse.successResponseWithData(res, 'Account linked successfully!', accountCreateObj)
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }


  async getStripeAccount(stripeAccountBody: GetStripeAccountDto, res: Response) {
    try {
      const { stylist_id } = stripeAccountBody;

      const connetedAccountInfo = await this.connectedAccountModel.findOne({ stylist_id: stylist_id })
      const stripeAccountInfo = await stripeData.accounts.retrieve(connetedAccountInfo.stripe_data.account);
      if (!stripeAccountInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Account not present!')
      }
      return this.apiResponse.successResponseWithData(res, 'Record found', stripeAccountInfo)
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }


  async payToStylist(payToStylist: PayoutToStylistDto, res: Response) {
    try {
      const { stylist_id, amount } = payToStylist;

      const connectedAccountInfo = await this.connectedAccountModel.findOne({ stylist_id: stylist_id });
      if (!connectedAccountInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Stripe account is not associated with this account.')
      }

      const transferInfo = await stripeData.transfers.create({
        amount: amount,
        currency: 'usd',
        destination: connectedAccountInfo.stripe_data.id,
        transfer_group: 'ORDER_NUMBER_123456789',
      });

      if (!transferInfo) {
        return this.apiResponse.successResponseWithNoData(res, 'Transfer failed!');
      }
      const createdData = await this.stylistTransferModel.create({ stylist_id: stylist_id, amount: amount, stripe_account_id: connectedAccountInfo.stripe_data.id })
      return this.apiResponse.successResponseWithData(res, 'Transfer initiated!', createdData);
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }


  async addCard(addCard: Request, res: Response) {
    try {
      const { type, lastd, exp_year, exp_month, holder_name, zip_code } = addCard.body;
      const { userid } = addCard.headers

      const checkCardExist = await this.userModel.findOne({ _id: userid, "cards.type": type, "cards.lastd": lastd }).select('cards');
      if (checkCardExist) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'This card is already added!')
      }

      let defaultCard = {
        isDefault: false
      }

      let checkFirstCard = await this.userModel.findOne({ _id: userid }).select('email cards');
      if (checkFirstCard && checkFirstCard.cards.length <= 0) {
        defaultCard = {
          isDefault: true
        }
      }

      const stripeInfo = await this.paymentHandler.createCustomer({ userId: userid.toString(), email: checkFirstCard.email });
      if (stripeInfo) {
        const createStripeCustomer = {
          type: type,
          lastd: lastd,
          customerId: stripeInfo.id,
          exp_year: exp_year,
          exp_month: exp_month,
          account_holder_name: holder_name,
          zip_code: zip_code,
          isDefault: defaultCard.isDefault,
        }

        await this.userModel.findByIdAndUpdate(userid, { $addToSet: { cards: createStripeCustomer } });
        return this.apiResponse.successResponseWithData(res, 'Card Added Successfully!', createStripeCustomer);
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }

  async deleteCard(user: CurrentUserDto, cardId: string, res: Response) {
    try {
      const checkCardExist = await this.userModel.findOne({ _id: new Types.ObjectId(user._id) }, { cards: { $elemMatch: { _id: cardId } } });
      if (checkCardExist && checkCardExist.cards.length <= 0) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'This card does not exists!')
      }

      await this.userModel.findByIdAndUpdate({ _id: user._id, "cards._id": cardId }, {
        $pull: {
          cards: {
            _id: cardId
          }
        }
      })

      const deletedInfo = await this.paymentHandler.deleteCustomer({ customerId: checkCardExist.cards[0].customerId });
      return this.apiResponse.successResponseWithData(res, 'Card deleted successfully', deletedInfo.deletedCustomer);
    } catch (e) {
      return this.apiResponse.ErrorResponse(res, e.message, {})
    }
  }


  async setDefaultCard(setDefault: Request, res: Response) {
    try {
      const { cardId } = setDefault.body;
      const { userid } = setDefault.headers;

      const checkCardExist = await this.userModel.findOne({ _id: userid }).select({ cards: { $elemMatch: { _id: cardId } } });

      if (checkCardExist && checkCardExist.cards.length <= 0) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'This card does not exists!')
      }

      const updateData = {
        "cards.$[elem].isDefault": false,
      }
      const arrayFilter = {
        "arrayFilters": [{ "elem.isDefault": true }],
      }

      await this.userModel.updateMany({ _id: userid }, { $set: updateData }, arrayFilter);

      const updatedData = {
        "cards.$.isDefault": true,
      }

      await this.userModel.findOneAndUpdate({ "cards._id": cardId, _id: userid }, { $set: updatedData }, { fields: { cards: 1 }, new: true });
      return this.apiResponse.successResponseWithData(res, 'Default card changed Successfully!', {});
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }


  async getAllCard(getCards: Request, res: Response) {
    try {
      const { userid } = getCards.headers

      const checkCardExist = await this.userModel.findOne({ _id: userid }).select("cards");
      if (checkCardExist && checkCardExist.cards.length > 0) {
        return this.apiResponse.successResponseWithData(res, 'Cards Found!', checkCardExist);
      } else {
        return this.apiResponse.successResponse(res, 'No Data Found!');
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }


  async updateCard(user: CurrentUserDto, updateCard: UpdateCardDto, res: Response) {
    try {
      const { card_id, holder_name } = updateCard;

      await this.userModel.updateOne({ _id: user._id, "cards._id": card_id }, {
        $set: {
          "cards.$.account_holder_name": holder_name
        }
      });
      return this.apiResponse.successResponseWithData(res, 'Card updated successfully', {})
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message)
    }
  }


  async paytipsToStylist(payToStylist: PayToStylistDto, res: Response) {
    try {
      const { customer_id, stylist_id, amount, order_id } = payToStylist;

      const stylistInfo = await this.serviceProviderModel.findOne({ _id: stylist_id }).lean();
      if (!stylistInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'No stylist associated with the passed value of stylist ID');
      }

      const orderInfo = await this.orderModel.findOne({ _id: order_id }).lean();
      if (!orderInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'No order with the given Id exists');
      }

      const tenPercent = 0.1 * orderInfo.bill_details.total_bill;
      if (amount < tenPercent) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'amount of tip must be greater than or equal to ten % of total bill amount of the order');
      }

      if (orderInfo.stylist_id.toString() !== stylist_id) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'this order is not fulfilled by this stylist');
      }

      await this.orderModel.findOneAndUpdate({ _id: orderInfo._id },
        {
          $set: { 'bill_details.tip_amount': amount },
          $inc: { 'bill_details.total_bill': amount }
        });

      const chargeInfo = await this.paymentHandler.createCharge({ amount, customerId: customer_id });
      return this.apiResponse.successResponseWithData(res, 'Charge created successfully', chargeInfo);
    } catch (error) {
      return this.apiResponse.ErrorResponseWithoutData(res, error.message);
    }
  }


  async refundAmount(req: Request, res: Response) {
    try {
      const { order_id, deducted_amount, message } = req.body;

      let deductedAmount = 0;
      if (deducted_amount) {
        deductedAmount = 0;
      } else {
        deductedAmount = parseFloat(deducted_amount);
        if (deductedAmount < 0) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Deducted amount cannot be less than 0');
        }
      }

      const orderInfo = await this.orderModel.findOne({ _id: order_id }).lean();
      if (!orderInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'No order exists with the given order ID');
      }

      if (orderInfo.booking_status === 6 || orderInfo.payment_status === 3) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'The order status is already cancelled or the payment is already refunded');
      }

      if (orderInfo.payment_status !== 0) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Payment was not fulfilled for that particular order');
      }

      const chargeID = orderInfo.charge_id;
      let amountToRefund = orderInfo.bill_details.total_bill - deductedAmount;
      amountToRefund = parseFloat(amountToRefund.toFixed(2));

      const refundInfo = await this.paymentHandler.refundPaymentHandler({ transactionId: chargeID, refundAmount: amountToRefund * 100 });
      if (refundInfo) {
        console.log(`refundInfo`, refundInfo)
      }
      await this.orderModel.findOneAndUpdate({ _id: orderInfo._id }, {
        $set: {
          cancel_user_type: 'customer',
          booking_status: 6, // setting the order status to be 6 [cancelled]
          payment_status: 3, // setting payment status to be refunded
          cancel_reason: message
        }
      }, { upsert: true });

      await this.customerTransactionModel.create({
        user_id: orderInfo.user_id,
        order_id: order_id,
        amount: amountToRefund,
        transaction_type: "addition",
        type: "payment",
        message: `refund of ${orderInfo.order_number}`
      })

      return this.apiResponse.successResponseWithNoData(res, 'Refund is successfull');

    } catch (error) {
      return this.apiResponse.ErrorResponseWithoutData(res, error.message);
    }
  }


  async cancellationCharge(cancelCharge: CancelChargeDto, res: Response) {
    try {
      const { order_id, person_type, timing, message } = cancelCharge;

      let matchQueryObj: FilterQuery<CancellationRules>;

      const orderInfo = await this.orderModel.findOne({ _id: order_id }).lean();
      if (!orderInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'No order with the given id is specified');
      }

      if (orderInfo.booking_status === 6 || orderInfo.payment_status === 3) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'The order status is already cancelled or the payment is already refunded');
      }

      const stylistInfo = await this.serviceProviderModel.findOne({ _id: orderInfo.stylist_id }).lean();
      if (!stylistInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'No stylist associated with the given order');
      }

      matchQueryObj = { types: person_type, order_status: ORDER_STATUS[orderInfo.booking_status], cancel_type: timing, service_type: BOOKING_TYPE[orderInfo.booking_type] };

      const cancellationRuleInfo = await this.cancellationRuleModel.findOne(matchQueryObj).lean();
      if (!cancellationRuleInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'there is no cancellation rule available for this scenerio');
      }

      let cancellationFees = (cancellationRuleInfo.cancellation_fee * orderInfo.bill_details.total_bill) / 100;
      cancellationFees = parseFloat(cancellationFees.toFixed(2));
      let refundAmount = undefined;

      if ((person_type === 'customer') && (orderInfo.payment_status === 0)) { // if the order payment is fulfilled successfully, then we will proceed doing money transactions
        refundAmount = orderInfo.bill_details.total_bill - cancellationFees;
        refundAmount = parseFloat(refundAmount.toFixed(2));

        const refundInfo = await this.paymentHandler.refundPaymentHandler({ transactionId: orderInfo.charge_id, refundAmount: refundAmount * 100 });
        if (refundInfo) {
          console.log(`refundInfo`, refundInfo)
        }

        await this.customerTransactionModel.create({
          user_id: orderInfo.user_id,
          order_id: order_id,
          amount: refundAmount,
          transaction_type: "addition",
          type: "payment",
          message: `refund of ${orderInfo.order_number}`
        });

        await this.serviceProviderModel.findOneAndUpdate({ _id: orderInfo.stylist_id }, { $inc: { 'wallet': cancellationFees } }, { upsert: true });
      } else if ((person_type === 'stylist') && (orderInfo.payment_status === 0)) {
        refundAmount = orderInfo.bill_details.total_bill;
        refundAmount = parseFloat(refundAmount.toFixed(2));

        const refundInfo = await this.paymentHandler.refundPaymentHandler({ transactionId: orderInfo.charge_id, refundAmount: refundAmount * 100 });
        if (refundInfo) {
          console.log(`refundInfo`, refundInfo)
        }

        await this.customerTransactionModel.create({
          user_id: orderInfo.user_id,
          order_id: order_id,
          amount: refundAmount,
          transaction_type: "addition",
          type: "payment",
          message: `refund of ${orderInfo.order_number}`
        });

        await this.serviceProviderModel.findOneAndUpdate({ _id: orderInfo.stylist_id }, { $inc: { 'wallet': -cancellationFees } }, { upsert: true });
        await this.userModel.findOneAndUpdate({ _id: orderInfo.user_id }, { $inc: { 'wallet_balance': cancellationFees } }, { upsert: true });
      }

      await this.orderModel.findOneAndUpdate({ _id: orderInfo._id }, {
        $set: {
          booking_status: 6,
          payment_status: 3,
          cancel_reason: message,
          cancel_user_type: person_type
        }
      }, { upsert: true });

      return this.apiResponse.successResponseWithNoData(res, 'Order Cancellation is successfull');
    } catch (error) {
      return this.apiResponse.ErrorResponseWithoutData(res, error.message);
    }
  }


  async emergencyCancellation(emergencyCancel: EmergencyCancelDto, res: Response) {
    try {
      const { reason_id, order_id } = emergencyCancel;

      const orderInfo = await this.orderModel.findOne({ _id: order_id }).lean();
      if (!orderInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'There is no that has this order ID');
      }

      const stylistInfo = await this.serviceProviderModel.findOne({ _id: orderInfo.stylist_id }).lean();
      if (!stylistInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'No stylist is associated with the given order');
      }

      const cancellationRuleInfo = await this.emergencyCancellationModel.findOne({ type: 'stylist', reason_id: reason_id }).lean();
      if (!cancellationRuleInfo) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'There is no such reason for which you cancel this order');
      }

      if (orderInfo.booking_status === 6 || orderInfo.payment_status === 3) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Either the order is already cancelled or, the refund of the payment of this order is already done');
      }

      const { cancellationFee, reason } = cancellationRuleInfo;
      let amountToStylist = (cancellationFee * orderInfo.bill_details.total_bill) / 100;
      amountToStylist = parseFloat(amountToStylist.toFixed(2));

      let amountToCustomer = orderInfo.bill_details.total_bill - amountToStylist;
      amountToCustomer = parseFloat(amountToCustomer.toFixed(2));

      const refundInfo = await this.paymentHandler.refundPaymentHandler({ transactionId: orderInfo.charge_id, refundAmount: amountToCustomer * 100 });
      if (refundInfo) {
        console.log(`refundInfo`, refundInfo)
      }

      await this.customerTransactionModel.create({
        user_id: orderInfo.user_id,
        order_id: order_id,
        amount: amountToCustomer,
        transaction_type: "addition",
        type: "payment",
        message: `refund of ${orderInfo.order_number}`
      });

      await this.serviceProviderModel.findOneAndUpdate({ _id: orderInfo.stylist_id }, { $inc: { 'wallet': amountToStylist } }, { upsert: true });
      await this.orderModel.findOneAndUpdate({ _id: orderInfo._id }, {
        $set: {
          booking_status: 6,
          payment_status: 3,
          cancel_reason: reason,
          cancel_user_type: 'stylist'
        }
      }, { upsert: true });

      return this.apiResponse.successResponseWithNoData(res, 'Order Cancellation is successfully done by stylist');
    } catch (error) {
      return this.apiResponse.ErrorResponseWithoutData(res, error.message);
    }
  }
}