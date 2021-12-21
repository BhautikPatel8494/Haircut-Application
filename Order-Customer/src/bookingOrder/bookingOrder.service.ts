import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import * as moment from 'moment';
import Stripe from 'stripe';
import axios from 'axios';

import {
  CUSTOMER_PROFILE,
  ORDER_RESCHEDULE_COUNT,
  WEEKDAY_LIST,
} from 'src/utils/constant';
import { UtilityService } from 'src/utils/utility.service';
import { ApiResponse } from 'src/utils/apiResponse.service';
import { ServiceProviders } from 'src/schema/serviceProvider.schema';
import { CancellationRules } from 'src/schema/cancellationRule.schema';
import { CustomerTransactions } from 'src/schema/customerTransaction.schema';
import { Notifications } from 'src/schema/notification.schema';
import { Schedules } from 'src/schema/schedule.schema';
import { Orders } from 'src/schema/order.schema';
import { Users } from 'src/schema/user.schema';
import { CustomerCarts } from 'src/schema/customerCart.schema';
import { DeviceNotifications } from 'src/schema/deviceNotification.schema';
import { CancleOrderDto, ChangeStatusDto, ConfirmOtpServiceDto, CreateDirectOrderDto, CreateOrderDto, FilterDto, RebookingOrderDto } from './bookingOrder.dto';
import { CurrentUserDto } from 'src/authentication/authentication.dto';

@Injectable()
export class BookingOrderService {
  constructor(
    @InjectModel('serviceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
    @InjectModel('cancellationRule') private readonly cancellationRuleModel: Model<CancellationRules>,
    @InjectModel('customerTransaction') private readonly customerTransactionModel: Model<CustomerTransactions>,
    @InjectModel('notifications') private readonly notificationsModel: Model<Notifications>,
    @InjectModel('schedules') private readonly schedulesModel: Model<Schedules>,
    @InjectModel('order') private readonly orderModel: Model<Orders>,
    @InjectModel('user') private readonly userModel: Model<Users>,
    @InjectModel('customerCarts') private readonly customerCartsModel: Model<CustomerCarts>,
    @InjectModel('deviceNotification') private readonly deviceNotificationModel: Model<DeviceNotifications>,
    private apiResponse: ApiResponse,
    private utilityService: UtilityService,
  ) { }

  async createChargeDirectOrder(amount: number, customerId: string) {
    const stripe = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
    return stripe.charges.create({
      amount: amount,
      currency: 'usd',
      customer: customerId,
    });
  }

  async createCharge(amount: number, stripe_customer_id: string) {
    const stripe = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
    const charge = await stripe.charges.create({
      amount: amount * 100,
      currency: 'usd',
      customer: stripe_customer_id,
      capture: false,
    });
    return charge;
  }

  async capturePayment(chargeId: string) {
    const stripe = new Stripe(process.env.STRIPE_SANDBOX_KEY, { apiVersion: '2020-08-27' });
    const capturePaymentIntent = await stripe.charges.capture(chargeId);
    return capturePaymentIntent;
  }

  async createTransaction(message: string, amount: number, user_id: string, transaction_type: string) {
    let transaction = await this.customerTransactionModel.create({
      user_id,
      amount,
      message,
      type: 'order-deduction',
      transaction_type: 'deduction',
    });
    return transaction;
  }

  async createPaymentTransaction(message: string, amount: number, user_id: string, transaction_type: string) {
    let transaction = await this.customerTransactionModel.create({
      user_id,
      amount,
      message,
      type: 'payment',
      transaction_type: 'deduction',
    });
    return transaction;
  }

  async checkStylistAvailabel(filterBody: FilterDto, res: Response) {
    try {
      const { stylist_id, date, start_time, end_time } = filterBody;
      const stylistInfo = await this.serviceProviderModel.findOne({ _id: stylist_id }, { active_schedule_type: 1 });
      if (stylistInfo) {
        const bookingInfo = await this.orderModel.find({ stylist_id: stylist_id, booking_status: { $in: [1, 2, 3, 5] } });
        const scheduleInfo = await this.schedulesModel.findOne({ stylist_id: stylist_id, schedule_type: stylistInfo.active_schedule_type });
        if (scheduleInfo && scheduleInfo.scheduled_days.length > 0) {
          const currentDate = moment(parseInt(date));
          let currentDay = currentDate.format('dddd');
          currentDay = WEEKDAY_LIST[currentDay];
          let nthOfMoth = Math.ceil(currentDate.date() / 7);
          let isScheduleExist;
          for (let i = 0; i < scheduleInfo.scheduled_days.length; i++) {
            if (scheduleInfo.week == nthOfMoth || scheduleInfo) {
              const scheduleDay = scheduleInfo.scheduled_days[i];
              for (let j = 0; j < scheduleDay.scheduled_times.length; j++) {
                const scheduleTime = scheduleDay.scheduled_times[j];
                if (scheduleDay.day == parseInt(currentDay) && scheduleDay.active == true && scheduleTime.active == true && scheduleTime.start_time == start_time && scheduleTime.end_time == end_time && !bookingInfo.length) {
                  isScheduleExist = true;
                } else {
                  isScheduleExist = false;
                }
              }
            }
          }
          return this.apiResponse.successResponseWithData(res, `Stylist is ${isScheduleExist ? 'available' : 'not available'}`, { isAvailable: isScheduleExist });
        } else {
          return this.apiResponse.successResponseWithData(res, 'Stylist is not available', { isAvailable: false });
        }
      } else {
        return this.apiResponse.ErrorResponse(res, 'Record not found', {});
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async createOrder(orderBody: CreateOrderDto, userAuth: CurrentUserDto, res: Response) {
    try {
      const { convenience_fee, service_charges, tax, discount, voucher, total_bills, voucher_amount, wallet_amount_used,
        card_amount_used, cart_id, from_time, to_time, stylist_id, booking_type, date, wallet_used, stripe_customer_id, } = orderBody

      let user = await this.userModel.findOne({ _id: userAuth._id });
      if (!user) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'User not found');
      }
      const convenienceFee = convenience_fee ? convenience_fee : '';
      const serviceCharges = service_charges ? service_charges : '';
      const discountAmount = discount ? discount : '';
      const taxAmount = tax ? tax : '';
      const totalBills = total_bills ? total_bills : '';
      const voucherNumber = voucher ? voucher : '';
      const voucherAmount = voucher_amount ? voucher_amount : '';
      const walletAmountUsed = wallet_amount_used ? wallet_amount_used : '';
      const cardAmountUsed = card_amount_used ? card_amount_used : '';

      let activeAdress = user.addresses.find((elem) => elem.active);

      let active_location = {
        address: activeAdress.address ? activeAdress.address : '',
        title: activeAdress.title ? activeAdress.title : '',
        address_type: activeAdress.address_type ? activeAdress.address_type : '',
        lat: activeAdress.lat ? activeAdress.lat : '',
        lng: activeAdress.lng ? activeAdress.lng : '',
        location: activeAdress.location ? activeAdress.location : '',
      };
      let cart = await this.customerCartsModel.findOne({ _id: cart_id, user_id: userAuth._id });
      if (!cart) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Record not found');
      }

      let selectedSlot = {
        from_time: from_time,
        to_time: to_time,
      };

      if (stylist_id != '' && booking_type == '1') {
        let booking = await this.orderModel.findOne({
          stylist_id: stylist_id,
          booking_type: 1,
          booking_status: 1,
          date: { $lte: date },
          selected_slot: selectedSlot,
        }, { _id: 1 });
        if (booking) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'This time slot is already selected by someone else');
        }
      }

      let walletBalance = user.wallet_balance ? user.wallet_balance : 0;
      let totalBill = cart.bill_details.total_bill;

      const totalBillDetail = {
        total_service: cart.bill_details.total_service,
        service_charges: serviceCharges,
        convenience_fee: convenienceFee,
        discount: discountAmount,
        voucher: voucherNumber,
        voucher_amount: voucherAmount,
        tax: taxAmount,
        total_bill: totalBills,
        wallet_amount_used: walletAmountUsed,
        card_amount_used: cardAmountUsed,
      };

      let stylistType = '';
      if (cart.stylist_type) {
        stylistType = `-${cart.stylist_type.toString().charAt(0).toUpperCase()}`;
      } else {
        stylistType = '';
      }

      let bookingType = '';
      if (booking_type == '0') {
        bookingType = '-O';
      } else if (booking_type == '1') {
        bookingType = '-S';
      } else {
        bookingType = '-D';
      }

      let cityName = '';
      if (activeAdress.city) {
        cityName = `-${activeAdress.city.toString().charAt(0).toUpperCase()}`;
      } else {
        cityName = '';
      }

      const orderNumber = `HS${stylistType}${bookingType}${cityName}-${Date.now().toString().substring(0, 10)}`;

      if (wallet_used) {
        if (walletBalance >= totalBill) {
          let updated_wallet_balance = walletBalance - totalBill;
          let amount_deducted = walletBalance - updated_wallet_balance;
          let createdObj = {
            order_number: orderNumber,
            user_id: userAuth._id,
            cart: cart.cart_profiles,
            booking_type: booking_type,
            bill_details: totalBillDetail,
            date: date,
            wallet_used: wallet_used,
            selected_slot: selectedSlot,
            stylist_id: stylist_id,
            active_location: active_location,
            stripe_customer_id: stripe_customer_id,
            wallet_amount_used: updated_wallet_balance ? updated_wallet_balance : 0,
            charge_id: '',
            created_at: Date.now(),
          };
          let message = `Paid To ${createdObj.order_number}`;
          let transactionType = 'deduction';
          await this.createTransaction(message, amount_deducted, userAuth._id, transactionType);
          const booking = await this.orderModel.create(createdObj)
          let active_adress = user.addresses.find((elem) => elem.active)
          let data = {
            lat: active_adress.lat,
            lng: active_adress.lng,
            city: active_adress.city,
            full_name: user.firstname || user.lastname ? user.firstname + ' ' + user.lastname : '',
            profile: user.profile ? CUSTOMER_PROFILE + user.profile : null,
            booking_type: parseInt(booking_type) === 0 ? 'On-Demand Order' : 'Scheduled Order',
            stylist_level: cart.stylist_type,
            created_at: `${booking.created_at}`,
            cart_profile: cart.cart_profiles,
            token: user.devices[0] ? user.devices[0].token : '',
            type: user.devices[0] ? user.devices[0].type : '',
            user_id: userAuth._id,
            stylist_id: stylist_id ? stylist_id : '',
            notification_type: parseInt(booking_type) === 0 ? 'on_demand_booking' : 'on_scheduled_booking',
            total_price: `${totalBill}`,
            order_id: booking._id ? booking._id : null,
            is_custom: false,
          };
          await this.utilityService.sendNotificationToNearbyStylist(data);

          let result = { _id: booking._id };
          await this.userModel.updateOne({ _id: userAuth._id }, { $set: { wallet_balance: updated_wallet_balance } });
          return this.apiResponse.successResponseWithData(res, 'Booking created!', result);
        } else {
          let billToDeductFromCard = cart.bill_details.total_bill - walletBalance;
          let chrg = await this.createCharge(billToDeductFromCard, stripe_customer_id);
          let createdObj = {
            order_number: orderNumber,
            user_id: userAuth._id,
            cart: cart.cart_profiles,
            booking_type: booking_type,
            bill_details: totalBillDetail,
            date: date,
            wallet_used: wallet_used,
            selected_slot: selectedSlot,
            stylist_id: stylist_id,
            active_location: active_location,
            stripe_customer_id: stripe_customer_id,
            wallet_amount_used: walletBalance ? walletBalance : 0,
            charge_id: chrg.id ? chrg.id : '',
            created_at: Date.now(),
          };

          const booking = await this.orderModel.create(createdObj)
          let activeAdress = user.addresses.find((elem) => elem.active)
          if (walletBalance > 0) {
            let message = `Paid To ${createdObj.order_number}`;
            let transaction_type = 'deduction';
            await this.createTransaction(message, walletBalance, userAuth._id, transaction_type);
          }
          let message = `Order ${createdObj.order_number}`;
          let transactionType = 'deduction';
          await this.createPaymentTransaction(message, billToDeductFromCard, userAuth._id, transactionType);
          let notify = {};
          if (parseInt(booking_type) === 0) {
            notify = await this.deviceNotificationModel.findOne({ type: 'on_demand_booking' });
          } else {
            notify = await this.deviceNotificationModel.findOne({ type: 'on_scheduled_booking' });
          }
          let data = {
            lat: activeAdress.lat,
            lng: activeAdress.lng,
            city: activeAdress.city,
            full_name: user.firstname || user.lastname ? user.firstname + ' ' + user.lastname : '',
            profile: user.profile ? CUSTOMER_PROFILE + user.profile : null,
            booking_type: parseInt(booking_type) === 0 ? 'On-Demand Order' : 'Scheduled Order',
            stylist_level: cart.stylist_type,
            created_at: `${booking.created_at}`,
            token: user.devices[0] ? user.devices[0].token : '',
            type: user.devices[0] ? user.devices[0].type : '',
            cart_profile: cart.cart_profiles,
            user_id: userAuth._id,
            stylist_id: stylist_id ? stylist_id : '',
            notification_type: parseInt(booking_type) === 0 ? 'on_demand_booking' : 'on_sheduled_booking',
            total_price: `${totalBill}`,
            order_id: booking._id ? booking._id : null,
            is_custom: false,
          };
          await this.utilityService.sendNotificationToNearbyStylist(data);
          let result = { _id: booking._id };
          await this.userModel.updateOne({ _id: userAuth._id }, { $set: { wallet_balance: 0 } });
          return this.apiResponse.successResponseWithData(res, 'Booking created!', result);
        }
      } else {
        let chrg = await this.createCharge(cart.bill_details.total_bill, stripe_customer_id);
        let createdObj = {
          order_number: orderNumber,
          user_id: userAuth._id,
          cart: cart.cart_profiles,
          booking_type: booking_type,
          bill_details: totalBillDetail,
          date: date,
          wallet_used: wallet_used,
          selected_slot: selectedSlot,
          stylist_id: stylist_id,
          active_location: active_location,
          stripe_customer_id: stripe_customer_id,
          wallet_amount_used: 0,
          charge_id: chrg.id ? chrg.id : '',
          created_at: Date.now(),
        };

        const booking = await this.orderModel.create(createdObj);

        let activeAdress = user.addresses.find((elem) => elem.active);
        let message = `Paid To ${createdObj.order_number}`;
        let transactionType = 'deduction';
        await this.createPaymentTransaction(message, cart.bill_details.total_bill, userAuth._id, transactionType);
        let data = {
          lat: activeAdress.lat,
          lng: activeAdress.lng,
          city: activeAdress.city,
          full_name: user.firstname || user.lastname ? user.firstname + ' ' + user.lastname : '',
          profile: user.profile ? CUSTOMER_PROFILE + user.profile : null,
          booking_type: parseInt(booking_type) === 0 ? 'On-Demand Order' : 'Scheduled Order',
          stylist_level: cart.stylist_type,
          created_at: `${booking.created_at}`,
          cart_profile: cart.cart_profiles,
          user_id: userAuth._id,
          stylist_id: stylist_id ? stylist_id : '',
          notification_type: parseInt(booking_type) === 0 ? 'on_demand_booking' : 'on_sheduled_booking',
          total_price: `${totalBill}`,
          order_id: booking._id ? booking._id : null,
          is_custom: false,
        };

        await this.utilityService.sendNotificationToNearbyStylist(data);
        let result = { _id: booking._id };
        if (Boolean(wallet_used)) {
          return this.apiResponse.successResponseWithData(res, 'Booking created!', result);
        } else {
          return this.apiResponse.successResponseWithData(res, 'Booking created!', result);
        }
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async changeBookingStatus(chnageStatusBody: ChangeStatusDto, res: Response) {
    const { order_id, stylist_id, status } = chnageStatusBody;
    try {
      const user = await this.orderModel.findOne({ _id: order_id });
      if (user.booking_type === 1) {
        let initalDate = new Date(user.date);
        let selectedSlot = user.selected_slot;
        let fromTimeSlot = selectedSlot.from_time ? selectedSlot.from_time.split(':') : '';
        let toTimeSlot = selectedSlot.to_time ? selectedSlot.to_time.split(':') : '';
        let fromTime = initalDate.setHours(parseInt(fromTimeSlot[0]), parseInt(fromTimeSlot[1]));
        let toTime = initalDate.setHours(parseInt(toTimeSlot[0]), parseInt(toTimeSlot[1]));
        if (fromTime > Date.now() && toTime <= Date.now()) {
          this.apiResponse.ErrorResponseWithoutData(res, 'Can not change status');
          return;
        }
      }
      if (user.stylist_id && user.stylist_id != stylist_id) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Order already accepted by someone else!');
      }
      if (user.order_rejected_by.indexOf(stylist_id) > -1) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Order already rejected by you!');
      }
      let query = {};
      let notificationType = '';
      let stylistInfo = await this.serviceProviderModel.findOne({ _id: stylist_id }, { firstname: 1 });
      let date = new Date();
      if (parseInt(status) === 1) {
        query = {
          booking_status: status,
          stylist_id: stylist_id,
          order_accepted_at: Math.floor(Date.now()),
        };
        notificationType = 'on_demand_request_accepted';
        if (user.charge_id) await this.capturePayment(user.charge_id);
      } else if (parseInt(status) === 2) {
        query = {
          $set: {
            booking_status: status,
            stylist_id: stylist_id,
            reached_location_at: Math.floor(Date.now()),
          },
        };
        notificationType = 'stylist_reached_location';
      } else if (parseInt(status) === 3) {
        notificationType = 'stylist_started_service';
        let orderUser = await this.userModel.findOne({ _id: user.user_id }, { phone_number: 1, country_code: 1 });

        if (!orderUser) {
          this.apiResponse.ErrorResponseWithoutData(res, 'This user is not present in our db!');
          return;
        }
        let activeBooking = await this.orderModel.findOne({ stylist_id: stylist_id, booking_status: 3 }, { _id: 1 });
        if (activeBooking) {
          this.apiResponse.ErrorResponseWithoutData(res, 'Oops seems like you already have active booking!');
          return;
        }

        const otp = 1234;
        const data = {
          otpMessage: `Your otp to start service is ${otp}`,
          country_code: orderUser.country_code,
          phone_number: orderUser.phone_number,
        };

        let updated = await this.orderModel.updateOne({ _id: order_id }, { $set: { start_service_otp: otp } });

        this.apiResponse.successResponseWithNoData(res, 'Otp sent!');
        if (user.charge_id) {
          await this.capturePayment(user.charge_id);
        }
        return;
      } else if (parseInt(status) === 4) {
        query = {
          $set: { booking_status: status, stylist_id: stylist_id, completed_at: Math.floor(Date.now()) },
        };
        notificationType = 'completed_order';

        let total_bill = user.bill_details.total_bill;
        await this.serviceProviderModel.updateOne({ _id: stylist_id }, { $inc: { wallet: total_bill } });
        if (user.addons_charge_id)
          await this.capturePayment(user.addons_charge_id);
      } else if (parseInt(status) === 5) {
        query = { $push: { order_rejected_by: stylist_id } };
        await this.notificationsModel.updateOne({ order_id: order_id, stylist_id: stylist_id }, { $set: { type: 'rejected' } });
      } else {
        query = { booking_status: status };
      }

      axios.post(process.env.NOTIFICATION_URL, {
        receiverId: user.user_id,
        notification_type: notificationType ? notificationType : null,
        extraData: {
          booking_id: user.order_number,
          stylist_firstname: stylistInfo.firstname,
        },
      });

      const userOrder = await this.orderModel.updateOne({ _id: order_id }, query);
      let result = {
        status: parseInt(status),
      };
      return this.apiResponse.successResponseWithData(res, 'Record updated', result);
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async createDirectOrder(createDirectOrder: CreateDirectOrderDto, userAuth: CurrentUserDto, res: Response) {
    try {
      const { convenience_fee, service_charges, discount, tax, total_bills, voucher, voucher_amount, wallet_amount_used, card_amount_used, cart_id, from_time, to_time,
        stylist_id, stripe_customer_id, date, booking_type } = createDirectOrder;
      let user = await this.userModel.findOne({ _id: userAuth._id });
      if (!user) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'User not found');
      }

      const convenienceFee = convenience_fee ? convenience_fee : 0;
      const serviceCharges = service_charges ? service_charges : 0;
      const discountAmount = discount ? discount : 0;
      const taxAmount = tax ? tax : 0;
      const totalBills = total_bills ? total_bills : 0;
      const voucherNumber = voucher ? voucher : '';
      const voucherAmount = voucher_amount ? voucher_amount : 0;
      const walletAmountUsed = wallet_amount_used ? wallet_amount_used : '';
      const cardAmountUsed = card_amount_used ? card_amount_used : '';

      let activeAdress = user.addresses.find((elem) => elem.active)
      let activeLocation = {
        address: activeAdress.address ? activeAdress.address : '',
        title: activeAdress.title ? activeAdress.title : '',
        address_type: activeAdress.address_type ? activeAdress.address_type : '',
        lat: activeAdress.lat ? activeAdress.lat : '',
        lng: activeAdress.lat ? activeAdress.lat : '',
        location: activeAdress.location ? activeAdress.location : '',
      };
      let cart = await this.customerCartsModel.findOne({ _id: cart_id, user_id: userAuth._id });
      if (!cart) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Cart not exists for this user!');
      }
      let query = {};
      if (from_time && to_time) {
        query = {
          stylist_id: stylist_id,
          booking_type: 1,
          booking_status: 1,
          date: { $lte: date },
          direct_order: 1,
          selected_slot: { from_time: from_time, to_time: to_time },
          active_location: activeLocation,
          stripe_customer_id: stripe_customer_id,
        };
      } else {
        query = {
          stylist_id: stylist_id,
          booking_type: 0,
          booking_status: 1,
          direct_order: 1,
          active_location: activeLocation,
          stripe_customer_id: stripe_customer_id,
        };
      }
      let bookingOrder = await this.orderModel.findOne(query, { _id: 1 });
      if (bookingOrder) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'This time slot is already selected by someone else');
      }
      let cardCustomer = user.cards.find((elem) => elem.isDefault)
      let totalBillDetail = {
        total_service: cart.bill_details.total_service,
        service_charges: serviceCharges,
        convenience_fee: convenienceFee,
        discount: discountAmount,
        voucher: voucherNumber,
        voucher_amount: voucherAmount,
        tax: taxAmount,
        total_bill: totalBills,
        wallet_amount_used: walletAmountUsed,
        card_amount_used: cardAmountUsed,
      };

      let amount = 0;
      if (cart.bill_details.total_bill > 0) {
        amount = cart.bill_details.total_bill * 100;
      } else {
        return this.apiResponse.ErrorResponseWithoutData(res, 'amount must me greater than 0');
      }
      const result = await this.createChargeDirectOrder(amount, cardCustomer.customerId)
      let createdObj = {};
      if (from_time && to_time) {
        createdObj = {
          order_number: 'HST-' + Date.now(),
          user_id: userAuth._id,
          cart: cart.cart_profiles,
          booking_type: booking_type,
          bill_details: totalBillDetail,
          date: date,
          selected_slot: { from_time: from_time, to_time: to_time },
          stylist_id: stylist_id,
          direct_order: 1,
          active_location: activeLocation,
          stripe_customer_id: stripe_customer_id ? stripe_customer_id : '',
          charge_id: result.id ? result.id : '',
          created_at: Date.now(),
        };
      } else {
        createdObj = {
          order_number: 'HST-' + Date.now(),
          user_id: userAuth._id,
          cart: cart.cart_profiles,
          booking_type: booking_type,
          bill_details: totalBillDetail,
          stylist_id: stylist_id,
          direct_order: 1,
          active_location: activeLocation,
          stripe_customer_id: stripe_customer_id ? stripe_customer_id : '',
          charge_id: result.id ? result.id : '',
          created_at: Date.now(),
        };
      }
      const booking = await this.orderModel.create(createdObj);
      let notify = {};
      if (booking._id) {
        notify = await this.deviceNotificationModel.findOne({ type: 'customer_booking' });
      }
      let data = {
        lat: activeAdress.lat,
        lng: activeAdress.lng,
        city: activeAdress.city,
        full_name: user.firstname || user.lastname ? user.firstname + ' ' + user.lastname : '',
        profile: user.profile ? CUSTOMER_PROFILE + user.profile : null,
        stylist_level: cart.stylist_type,
        booking_type: 'Custom Order',
        created_at: `${booking.created_at}`,
        token: user.devices[0] ? user.devices[0].token : '',
        type: user.devices[0] ? user.devices[0].type : '',
        user_id: userAuth._id,
        is_custom: true,
        stylist_id: stylist_id,
        notification_type: 'on_custom_booking',
        total_price: `${cart.bill_details.total_bill}`,
        order_id: booking._id ? booking._id : null,
      };
      let resultBooking = { _id: booking._id };

      await this.utilityService.sendNotificationToNearbyStylist(data);
      return this.apiResponse.successResponseWithData(res, 'Booking created!', resultBooking);
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async cancleOrder(cancleOrder: CancleOrderDto, res: Response) {
    try {
      const { order_id, service_type, user_type, reason } = cancleOrder;
      const data = await this.orderModel.findOne({ _id: order_id, booking_status: { $nin: [4, 6] } });
      if (!data) {
        this.apiResponse.ErrorResponseWithoutData(res, 'Order not found!');
        return;
      }
      let query;
      let service = service_type == 1 ? 'scheduled_service' : 'on_demand_service';
      if (data.booking_status === 0) {
        query = {
          types: user_type,
          service_type: service,
          order_status: 'not_assigned',
        };
      } else if (data.booking_status === 1) {
        query = {
          types: user_type,
          service_type: service,
          order_status: 'stylist_assigned',
        };
      } else if (data.booking_status === 2) {
        query = {
          types: user_type,
          service_type: service,
          order_status: 'reached_location',
        };
      } else if (data.booking_status === 3) {
        query = {
          types: user_type,
          service_type: service,
          order_status: 'start_service',
        };
      }

      const charges = await this.cancellationRuleModel.findOne(query);
      if (!charges) {
        return this.apiResponse.successResponseWithData(res, 'No Cancellation charge', charges);
      }
      let cancellationPercentage = charges.cancellation_fee ? charges.cancellation_fee : 0;
      let serviceCharge = data.bill_details.service_charges;
      let cancellationCharge = (serviceCharge * cancellationPercentage) / 100;
      data.bill_details.cancellation_charge = cancellationCharge;
      data.bill_details.cancellation_fee = cancellationPercentage;

      axios.post(process.env.NOTIFICATION_URL, {
        receiverId: user_type == 'customer' ? data.stylist_id : data.user_id,
        notification_type: user_type == 'customer' ? 'customer_cancel_order' : 'stylist_cancel_order',
        extraData: { booking_id: data.order_number },
      });
      const update = await this.orderModel.updateOne({ _id: order_id },
        {
          $set: {
            cancel_reason: reason,
            bill_details: data.bill_details,
            booking_status: 6,
          },
        },
      );
      if (update) {
        return this.apiResponse.successResponseWithNoData(res, 'Booking cancelled!');
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async confirmOtpToStartService(startService: ConfirmOtpServiceDto, res: Response) {
    try {
      const { booking_id, stylist_id, otp } = startService;
      const booking = await this.orderModel.findOne({ _id: booking_id });
      if (!booking) {
        this.apiResponse.ErrorResponseWithoutData(res, 'Booking not found!');
        return;
      }
      if (parseInt(booking.start_service_otp) !== parseInt(otp)) {
        this.apiResponse.ErrorResponseWithoutData(res, 'Entered otp is wrong!');
        return;
      }
      let dataToUpdate = {
        start_service_otp: null,
        booking_status: 3,
        stylist_id: stylist_id,
        started_service_at: Math.floor(Date.now()),
      };
      const bookingUpdate = await this.orderModel.updateOne({ _id: booking_id }, { $set: dataToUpdate });
      if (bookingUpdate) {
        this.apiResponse.successResponseWithData(res, 'Service started!', dataToUpdate);
        return;
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async reBookingOrder(rebookingOrder: RebookingOrderDto, userAuth: CurrentUserDto, res: Response) {
    try {
      const { order_id, stripe_customer_id, date, from_time, to_time } = rebookingOrder;
      const user = await this.orderModel.findOne({ _id: order_id },
        {
          bill_details: 1,
          reschedule_count: 1,
          stylist_id: 1,
          active_location: 1,
          user_id: 1,
          cart: 1,
          booking_type: 1,
          direct_order: 1,
          date: 1,
        },
      );
      const chrg = await this.createCharge(user.bill_details.total_bill, stripe_customer_id);
      if (!user) {
        this.apiResponse.ErrorResponseWithoutData(res, 'Order not found!');
        return;
      }
      if (user.reschedule_count >= ORDER_RESCHEDULE_COUNT) {
        await this.orderModel.updateOne({ _id: order_id },
          {
            $set: {
              cancelled_reason: 'reached maximum reschedule count',
              booking_status: 6,
            },
          },
        );
        this.apiResponse.ErrorResponseWithoutData(res, 'Maximum reschedule count reached!');
        return;
      }
      let details = {
        order_number: 'HST-' + Date.now(),
        bill_details: user.bill_details,
        active_location: user.active_location,
        user_id: user.user_id,
        cart: user.cart,
        booking_type: user.booking_type,
        direct_order: user.direct_order,
        date: user.date,
        stripe_customer_id: stripe_customer_id,
        charge_id: chrg.id ? chrg.id : '',
        selected_slot: null,
      };
      if (date && from_time && to_time) {
        if (user.booking_type === 1) {
        } else {
          throw new Error('Not a scheduled order');
        }
        details.date = date;
        let slot = {
          from_time: from_time,
          to_time: to_time,
        };
        details.selected_slot = slot;
      }
      const result = await this.orderModel.create(details);
      let userInfo = await this.userModel.findOne({ _id: userAuth._id });
      let activeAdress = userInfo.addresses.find((elem) => elem.active)
      let notificationType = {};
      if (details.booking_type == 0) {
        notificationType = { type: 'on_demand_booking' };
      } else {
        notificationType = { type: 'on_scheduled_booking' };
      }
      const notificationInfo = await this.deviceNotificationModel.findOne(notificationType);
      let data = {
        lat: activeAdress.lat,
        lng: activeAdress.lng,
        full_name: userInfo.firstname || userInfo.lastname ? userInfo.firstname + ' ' + userInfo.lastname : '',
        profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
        booking_type: details.booking_type == 0 ? 'On-Demand Order' : 'Scheduled Order',
        created_at: `${result.created_at}`,
        token: userInfo.devices[0] ? userInfo.devices[0].token : '',
        type: userInfo.devices[0] ? userInfo.devices[0].type : '',
        user_id: userInfo._id,
        title: notificationInfo.title,
        body: notificationInfo.body,
        notification_type: notificationInfo.type,
        total_price: `${details.bill_details.total_bill}`,
        order_id: result._id ? result._id : null,
        is_custom: true,
      };
      await this.utilityService.sendNotificationToNearbyStylist(data);
      await this.orderModel.updateOne({ _id: order_id }, { $inc: { reschedule_count: 1 } });
      return this.apiResponse.successResponseWithData(res, 'Order created!', result);
    } catch (e) {
      console.log('e :>> ', e);
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }
}
