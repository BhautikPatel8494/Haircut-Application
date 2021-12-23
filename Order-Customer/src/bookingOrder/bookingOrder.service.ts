import { BadRequestException, Injectable } from '@nestjs/common';
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
import { CancellationRule } from 'src/schema/cancellationRule.schema';
import { CustomerTransactions } from 'src/schema/customerTransaction.schema';
import { Notifications } from 'src/schema/notification.schema';
import { Schedules } from 'src/schema/schedule.schema';
import { Orders } from 'src/schema/order.schema';
import { Users } from 'src/schema/user.schema';
import { CustomerCarts } from 'src/schema/customerCart.schema';
import { DeviceNotification } from 'src/schema/deviceNotification.schema';
import { CancleOrderDto, ChangeStatusDto, ConfirmOtpServiceDto, CreateDirectOrderDto, CreateOrderDto, FilterDto, RebookingOrderDto } from './bookingOrder.dto';
import { CurrentUserDto } from 'src/authentication/authentication.dto';
import { PaymentHandlerService } from '../utils/paymentHandler.service';

@Injectable()
export class BookingOrderService {
  constructor(
    @InjectModel('ServiceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
    @InjectModel('CancellationRule') private readonly cancellationRuleModel: Model<CancellationRule>,
    @InjectModel('CustomerTransaction') private readonly customerTransactionModel: Model<CustomerTransactions>,
    @InjectModel('Notification') private readonly notificationsModel: Model<Notifications>,
    @InjectModel('Schedule') private readonly schedulesModel: Model<Schedules>,
    @InjectModel('Order') private readonly orderModel: Model<Orders>,
    @InjectModel('User') private readonly userModel: Model<Users>,
    @InjectModel('CustomerCart') private readonly customerCartsModel: Model<CustomerCarts>,
    @InjectModel('DeviceNotification') private readonly deviceNotificationModel: Model<DeviceNotification>,
    private readonly paymentHandlerService: PaymentHandlerService,
    private readonly apiResponse: ApiResponse,
    private readonly utilityService: UtilityService,
  ) { }


  async checkStylistAvailable(filterBody: FilterDto, res: Response) {
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
          const weekOfMonth = (0 | currentDate.date() / 7) + 1;
          let isScheduleExist = false;
          for (let i = 0; i < scheduleInfo.scheduled_days.length; i++) {
            if (scheduleInfo.week == weekOfMonth || scheduleInfo) {
              const scheduleDay = scheduleInfo.scheduled_days[i];
              for (let j = 0; j < scheduleDay.scheduled_times.length; j++) {
                const scheduleTime = scheduleDay.scheduled_times[j];
                if (scheduleDay.day == parseInt(currentDay) && scheduleDay.active == true && scheduleTime.active == true && scheduleTime.start_time == start_time && scheduleTime.end_time == end_time && bookingInfo.length < 0) {
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

  async createOrder(orderBody: CreateOrderDto, user: CurrentUserDto, res: Response) {
    try {
      const { convenience_fee, service_charges, tax, discount, voucher, total_bills, voucher_amount, wallet_amount_used,
        card_amount_used, cart_id, from_time, to_time, stylist_id, booking_type, date, wallet_used, stripe_customer_id, } = orderBody

      const userInfo = await this.userModel.findOne({ _id: user._id });
      if (userInfo) {
        const convenienceFee = convenience_fee ? convenience_fee : null;
        const serviceCharges = service_charges ? service_charges : null;
        const discountAmount = discount ? discount : null;
        const taxAmount = tax ? tax : null;
        const totalBills = total_bills ? total_bills : null;
        const voucherNumber = voucher ? voucher : null;
        const voucherAmount = voucher_amount ? voucher_amount : null;
        const walletAmountUsed = wallet_amount_used ? wallet_amount_used : null;
        const cardAmountUsed = card_amount_used ? card_amount_used : null;

        const activeAddress = userInfo.addresses.find((elem) => elem.active);

        const activeLocation = {
          address: activeAddress.address ? activeAddress.address : null,
          title: activeAddress.title ? activeAddress.title : null,
          address_type: activeAddress.address_type ? activeAddress.address_type : null,
          lat: activeAddress.lat ? activeAddress.lat : null,
          lng: activeAddress.lng ? activeAddress.lng : null,
          location: activeAddress.live_location ? activeAddress.live_location : null,
          state: activeAddress.state ? activeAddress.state : null,
          city: activeAddress.city ? activeAddress.city : null
        };

        const customerCartInfo = await this.customerCartsModel.findOne({ _id: cart_id, user_id: user._id });
        if (customerCartInfo) {
          const selectedSlot = {
            from_time: from_time,
            to_time: to_time,
          };

          if (stylist_id && booking_type == 1) {
            const orderInfo = await this.orderModel.findOne({
              stylist_id: stylist_id,
              booking_type: 1,
              booking_status: 1,
              date: { $lte: date },
              selected_slot: selectedSlot,
            }, { _id: 1 });

            if (orderInfo) {
              return this.apiResponse.ErrorResponseWithoutData(res, 'This time slot is already selected by someone else');
            }
          }

          const walletBalance = userInfo.wallet_balance ? userInfo.wallet_balance : 0;
          const totalBill = customerCartInfo.bill_details.total_bill;

          const totalBillDetail = {
            total_service: customerCartInfo.bill_details.total_service,
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
          if (customerCartInfo.stylist_type) {
            stylistType = `-${customerCartInfo.stylist_type.toString().charAt(0).toUpperCase()}`;
          } else {
            stylistType = '';
          }

          let bookingType = '';
          if (booking_type == 0) {
            bookingType = '-O';
          } else if (booking_type == 1) {
            bookingType = '-S';
          } else {
            bookingType = '-D';
          }

          let cityName = '';
          if (activeAddress.city) {
            cityName = `-${activeAddress.city.toString().charAt(0).toUpperCase()}`;
          } else {
            cityName = '';
          }

          const orderNumber = `HS${stylistType}${bookingType}${cityName}-${Date.now().toString().substring(0, 10)}`;

          if (wallet_used) {
            if (walletBalance >= totalBill) {
              const updatedWalletBalance = walletBalance - totalBill;
              const amountDeducted = walletBalance - updatedWalletBalance;

              const createOrderObj = {
                order_number: orderNumber,
                user_id: user._id,
                cart: customerCartInfo.cart_profiles,
                booking_type: booking_type,
                bill_details: totalBillDetail,
                date: date,
                wallet_used: wallet_used,
                selected_slot: selectedSlot,
                stylist_id: stylist_id,
                active_location: activeLocation,
                stripe_customer_id: stripe_customer_id,
                wallet_amount_used: updatedWalletBalance ? updatedWalletBalance : 0,
                charge_id: null,
                created_at: Date.now(),
              };

              const message = `Paid To ${createOrderObj.order_number}`;
              await this.paymentHandlerService.createTransaction({ message: message, amount: amountDeducted, user_id: user._id });
              const orderCreatedResult = await this.orderModel.create(createOrderObj)

              const orderNotificationObj = {
                lat: activeAddress.lat,
                lng: activeAddress.lng,
                city: activeAddress.city,
                full_name: userInfo.firstname || userInfo.lastname ? `${userInfo.firstname} ${userInfo.lastname}` : null,
                profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
                booking_type: booking_type == 0 ? 'on_demand' : 'on_scheduled',
                stylist_level: customerCartInfo.stylist_type,
                created_at: `${orderCreatedResult.created_at}`,
                cart_profile: customerCartInfo.cart_profiles,
                token: userInfo.devices[0] ? userInfo.devices[0].token : null,
                type: userInfo.devices[0] ? userInfo.devices[0].type : null,
                user_id: user._id,
                stylist_id: stylist_id ? stylist_id : null,
                notification_type: booking_type === 0 ? 'on_demand_booking' : 'on_scheduled_booking',
                total_price: `${totalBill}`,
                order_id: orderCreatedResult._id ? orderCreatedResult._id : null,
                is_custom: false,
              };

              await this.userModel.updateOne({ _id: user._id }, { $set: { wallet_balance: updatedWalletBalance } });
              return await this.utilityService.sendNotificationToNearbyStylist(orderNotificationObj, res);
            } else {
              const amountDeducted = customerCartInfo.bill_details.total_bill - walletBalance;
              const chargeInfo = await this.paymentHandlerService.createCharge({ amount: amountDeducted, customerId: stripe_customer_id });
              const createOrderObj = {
                order_number: orderNumber,
                user_id: user._id,
                cart: customerCartInfo.cart_profiles,
                booking_type: booking_type,
                bill_details: totalBillDetail,
                date: date,
                wallet_used: wallet_used,
                selected_slot: selectedSlot,
                stylist_id: stylist_id,
                active_location: activeLocation,
                stripe_customer_id: stripe_customer_id,
                wallet_amount_used: walletBalance ? walletBalance : 0,
                charge_id: chargeInfo.id ? chargeInfo.id : null,
                created_at: Date.now(),
              };

              const orderCreatedResult = await this.orderModel.create(createOrderObj);

              if (walletBalance > 0) {
                const message = `Paid To ${orderCreatedResult.order_number}`;
                await this.paymentHandlerService.createTransaction({ message: message, amount: walletBalance, user_id: user._id });
              }

              const message = `Order ${orderCreatedResult.order_number}`;
              await this.paymentHandlerService.createPaymentTransaction({ message: message, amount: amountDeducted, user_id: user._id });
              const orderNotificationObj = {
                lat: activeAddress.lat,
                lng: activeAddress.lng,
                city: activeAddress.city,
                full_name: userInfo.firstname || userInfo.lastname ? `${userInfo.firstname} ${userInfo.lastname}` : null,
                profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
                booking_type: booking_type == 0 ? 'on_demand' : 'on_scheduled',
                stylist_level: customerCartInfo.stylist_type,
                created_at: `${orderCreatedResult.created_at}`,
                token: userInfo.devices[0] ? userInfo.devices[0].token : null,
                type: userInfo.devices[0] ? userInfo.devices[0].type : null,
                cart_profile: customerCartInfo.cart_profiles,
                user_id: user._id,
                stylist_id: stylist_id ? stylist_id : null,
                notification_type: booking_type === 0 ? 'on_demand_booking' : 'on_sheduled_booking',
                total_price: `${totalBill}`,
                order_id: orderCreatedResult._id ? orderCreatedResult._id : null,
                is_custom: false,
              };
              await this.userModel.updateOne({ _id: user._id }, { $set: { wallet_balance: 0 } });
              return await this.utilityService.sendNotificationToNearbyStylist(orderNotificationObj, res);
            }
          } else {
            const chargeInfo = await this.paymentHandlerService.createCharge({ amount: customerCartInfo.bill_details.total_bill, customerId: stripe_customer_id });

            const createOrderObj = {
              order_number: orderNumber,
              user_id: user._id,
              cart: customerCartInfo.cart_profiles,
              booking_type: booking_type,
              bill_details: totalBillDetail,
              date: date,
              wallet_used: wallet_used,
              selected_slot: selectedSlot,
              stylist_id: stylist_id,
              active_location: activeLocation,
              stripe_customer_id: stripe_customer_id,
              wallet_amount_used: 0,
              charge_id: chargeInfo.id ? chargeInfo.id : null,
            };

            const orderInfo = await this.orderModel.create(createOrderObj);

            const message = `Paid To ${createOrderObj.order_number}`;
            await this.paymentHandlerService.createPaymentTransaction({ message: message, amount: customerCartInfo.bill_details.total_bill, user_id: user._id });

            const orderNotificationObj = {
              lat: activeAddress.lat,
              lng: activeAddress.lng,
              city: activeAddress.city,
              full_name: userInfo.firstname || userInfo.lastname ? `${userInfo.firstname} ${userInfo.lastname}` : '',
              profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
              booking_type: booking_type == 0 ? 'on_demand' : 'on_scheduled',
              stylist_level: customerCartInfo.stylist_type,
              created_at: `${orderInfo.created_at}`,
              cart_profile: customerCartInfo.cart_profiles,
              user_id: user._id,
              stylist_id: stylist_id ? stylist_id : '',
              notification_type: booking_type === 0 ? 'on_demand_booking' : 'on_sheduled_booking',
              total_price: `${totalBill}`,
              order_id: orderInfo._id ? orderInfo._id : null,
              is_custom: false,
            };
            return await this.utilityService.sendNotificationToNearbyStylist(orderNotificationObj, res);
          }
        } else {
          return this.apiResponse.ErrorResponse(res, 'Cart not found', {})
        }
      } else {
        return this.apiResponse.ErrorResponse(res, 'User not found', {})
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async changeBookingStatus(chnageStatusBody: ChangeStatusDto, res: Response) {
    const { order_id, stylist_id, status } = chnageStatusBody;
    try {
      const orderInfo = await this.orderModel.findOne({ _id: order_id });
      if (orderInfo.booking_type === 1) {
        const initialDate = new Date(orderInfo.date);
        const selectedSlot = orderInfo.selected_slot;
        const fromTimeInfo = selectedSlot.from_time ? selectedSlot.from_time.split(':') : null;
        const toTimeInfo = selectedSlot.to_time ? selectedSlot.to_time.split(':') : null;
        const fromTime = initialDate.setHours(parseInt(fromTimeInfo[0]), parseInt(fromTimeInfo[1]));
        const toTime = initialDate.setHours(parseInt(toTimeInfo[0]), parseInt(toTimeInfo[1]));
        if (fromTime > Date.now() && toTime <= Date.now()) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Can not change status');
        }
      }
      if (orderInfo.stylist_id && orderInfo.stylist_id != stylist_id) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Order already accepted by someone else!');
      }
      if (orderInfo.order_rejected_by.indexOf(stylist_id) > -1) {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Order already rejected by you!');
      }
      let updateQuery = {};
      let notificationType = null;
      const stylistInfo = await this.serviceProviderModel.findOne({ _id: stylist_id }, { firstname: 1 });
      if (status == '1') {
        updateQuery = { booking_status: status, stylist_id: stylist_id, order_accepted_at: Math.floor(Date.now()) };
        notificationType = 'on_demand_request_accepted';
      } else if (parseInt(status) === 2) {
        updateQuery = { $set: { booking_status: status, stylist_id: stylist_id, reached_location_at: Math.floor(Date.now()) } };
        notificationType = 'stylist_reached_location';
      } else if (parseInt(status) === 3) {
        notificationType = 'stylist_started_service';
        const orderUser = await this.userModel.findOne({ _id: orderInfo.user_id }, { phone_number: 1, country_code: 1 });
        if (!orderUser) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'This user is not present in our db!');
        }

        const isActiveOrder = await this.orderModel.findOne({ stylist_id: stylist_id, booking_status: 3 }, { _id: 1 });
        if (isActiveOrder) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Oops seems like you already have active booking!');
        }

        const otp = 1234;
        const data = {
          otpMessage: `Your otp to start service is ${otp}`,
          country_code: orderUser.country_code,
          phone_number: orderUser.phone_number,
        };

        await this.orderModel.updateOne({ _id: order_id }, { $set: { start_service_otp: otp } });
      } else if (parseInt(status) === 4) {
        updateQuery = { $set: { booking_status: status, stylist_id: stylist_id, completed_at: Math.floor(Date.now()) } };
        notificationType = 'completed_order';
        const total_bill = orderInfo.bill_details.total_bill;
        await this.serviceProviderModel.updateOne({ _id: stylist_id }, { $inc: { wallet: total_bill } });

        if (orderInfo.charge_id) await this.paymentHandlerService.capturePayment({ chargeId: orderInfo.charge_id });
        if (orderInfo.addons_charge_id) await this.paymentHandlerService.capturePayment({ chargeId: orderInfo.addons_charge_id });
      } else if (parseInt(status) === 5) {
        updateQuery = { $push: { order_rejected_by: stylist_id } };
        await this.notificationsModel.updateOne({ order_id: order_id, stylist_id: stylist_id }, { $set: { type: 'rejected' } });
      } else {
        updateQuery = { booking_status: status };
      }

      await axios.post(process.env.NOTIFICATION_URL, {
        receiverId: orderInfo.user_id,
        notification_type: notificationType ? notificationType : null,
        extraData: {
          booking_id: orderInfo.order_number,
          stylist_firstname: stylistInfo.firstname,
        },
      });

      await this.orderModel.updateOne({ _id: order_id }, updateQuery);
      const responseObj = { status: parseInt(status) };
      if (status == '2') {
        return this.apiResponse.successResponseWithNoData(res, 'Otp sent!');
      } else {
        return this.apiResponse.successResponseWithData(res, 'Record updated', responseObj);
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async createDirectOrder(createDirectOrder: CreateDirectOrderDto, user: CurrentUserDto, res: Response) {
    try {
      const { convenience_fee, service_charges, discount, tax, total_bills, voucher, voucher_amount, wallet_amount_used, card_amount_used, cart_id, from_time, to_time,
        stylist_id, stripe_customer_id, date, booking_type } = createDirectOrder;

      const userInfo = await this.userModel.findOne({ _id: user._id });
      if (userInfo) {

        const convenienceFee = convenience_fee ? convenience_fee : 0;
        const serviceCharges = service_charges ? service_charges : 0;
        const discountAmount = discount ? discount : 0;
        const taxAmount = tax ? tax : 0;
        const totalBills = total_bills ? total_bills : 0;
        const voucherNumber = voucher ? voucher : null;
        const voucherAmount = voucher_amount ? voucher_amount : 0;
        const walletAmountUsed = wallet_amount_used ? wallet_amount_used : 0;
        const cardAmountUsed = card_amount_used ? card_amount_used : 0;

        const activeAddress = userInfo.addresses.find((element) => element.active);

        const activeLocation = {
          address: activeAddress.address ? activeAddress.address : null,
          title: activeAddress.title ? activeAddress.title : null,
          address_type: activeAddress.address_type ? activeAddress.address_type : null,
          lat: activeAddress.lat ? activeAddress.lat : null,
          lng: activeAddress.lat ? activeAddress.lat : null,
          location: activeAddress.location ? activeAddress.location : null,
        };

        const customerCartInfo = await this.customerCartsModel.findOne({ _id: cart_id, user_id: user._id });
        if (!customerCartInfo) {

          let stylistType = '';
          if (customerCartInfo.stylist_type) {
            stylistType = `-${customerCartInfo.stylist_type.toString().charAt(0).toUpperCase()}`;
          } else {
            stylistType = '';
          }

          let cityName = '';
          if (activeAddress.city) {
            cityName = `-${activeAddress.city.toString().charAt(0).toUpperCase()}`;
          } else {
            cityName = '';
          }

          const orderNumber = `HS${stylistType}-D${cityName}-${Date.now().toString().substring(0, 10)}`;
          let matchQuery = {};
          if (from_time && to_time) {
            matchQuery = {
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
            matchQuery = {
              stylist_id: stylist_id,
              booking_type: 0,
              booking_status: 1,
              direct_order: 1,
              active_location: activeLocation,
              stripe_customer_id: stripe_customer_id,
            };
          }
          let bookingOrder = await this.orderModel.findOne(matchQuery, { _id: 1 });
          if (bookingOrder) {
            return this.apiResponse.ErrorResponseWithoutData(res, 'This time slot is already selected by someone else');
          }
          let customerCardInfo = userInfo.cards.find((elem) => elem.isDefault)
          let totalBillDetail = {
            total_service: customerCartInfo.bill_details.total_service,
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

          let deductedAmount = 0;
          if (customerCartInfo.bill_details.total_bill > 0) {
            deductedAmount = customerCartInfo.bill_details.total_bill * 100;
          } else {
            return this.apiResponse.ErrorResponseWithoutData(res, 'amount must me greater than 0');
          }

          const chargeInfo = await this.paymentHandlerService.createChargeDirectOrder({ amount: deductedAmount, customerId: customerCardInfo.customerId });
          let createOrderObj = {};
          if (from_time && to_time) {
            createOrderObj = {
              order_number: orderNumber,
              user_id: user._id,
              cart: customerCartInfo.cart_profiles,
              booking_type: booking_type,
              bill_details: totalBillDetail,
              date: date,
              selected_slot: { from_time: from_time, to_time: to_time },
              stylist_id: stylist_id,
              direct_order: 1,
              active_location: activeLocation,
              stripe_customer_id: stripe_customer_id ? stripe_customer_id : '',
              charge_id: chargeInfo.id ? chargeInfo.id : '',
              created_at: Date.now(),
            };
          } else {
            createOrderObj = {
              order_number: 'HST-' + Date.now(),
              user_id: user._id,
              cart: customerCartInfo.cart_profiles,
              booking_type: booking_type,
              bill_details: totalBillDetail,
              stylist_id: stylist_id,
              direct_order: 1,
              active_location: activeLocation,
              stripe_customer_id: stripe_customer_id ? stripe_customer_id : '',
              charge_id: chargeInfo.id ? chargeInfo.id : '',
              created_at: Date.now(),
            };
          }
          const orderInfo = await this.orderModel.create(createOrderObj);
          const orderNotificationObj = {
            lat: activeAddress.lat,
            lng: activeAddress.lng,
            city: activeAddress.city,
            full_name: userInfo.firstname || userInfo.lastname ? userInfo.firstname + ' ' + userInfo.lastname : '',
            profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
            stylist_level: customerCartInfo.stylist_type,
            booking_type: 'custom',
            created_at: `${orderInfo.created_at}`,
            token: userInfo.devices[0] ? userInfo.devices[0].token : '',
            type: userInfo.devices[0] ? userInfo.devices[0].type : '',
            user_id: user._id,
            is_custom: true,
            stylist_id: stylist_id,
            notification_type: 'on_custom_booking',
            total_price: `${customerCartInfo.bill_details.total_bill}`,
            order_id: orderInfo._id ? orderInfo._id : null,
          };

          return await this.utilityService.sendNotificationToNearbyStylist(orderNotificationObj, res);
        } else {
          return this.apiResponse.ErrorResponse(res, 'Cart not exists for this user!', {});
        }
      } else {
        return this.apiResponse.ErrorResponse(res, 'User not found!', {});
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async cancleOrder(user: CurrentUserDto, cancleOrder: CancleOrderDto, res: Response) {
    try {
      const { order_id, service_type, user_type, reason } = cancleOrder;

      const orderInfo = await this.orderModel.findOne({ _id: order_id, booking_status: { $nin: [4, 6] } });
      if (orderInfo) {
        let queryMatch = {};
        const serviceType = service_type === 1 ? 'scheduled_service' : 'on_demand_service';
        if (orderInfo.booking_status === 0) {
          queryMatch = { types: user_type, service_type: serviceType, order_status: 'not_assigned' };
        } else if (orderInfo.booking_status === 1) {
          queryMatch = { types: user_type, service_type: serviceType, order_status: 'stylist_assigned' };
        } else if (orderInfo.booking_status === 2) {
          queryMatch = { types: user_type, service_type: serviceType, order_status: 'reached_location' };
        } else if (orderInfo.booking_status === 3) {
          queryMatch = { types: user_type, service_type: serviceType, order_status: 'start_service' };
        }

        const cancellationRule = await this.cancellationRuleModel.findOne(queryMatch);
        if (cancellationRule) {
          const userInfo = await this.userModel.findOne({ _id: user._id });
          const cancellationPercentage = cancellationRule.cancellation_fee ? cancellationRule.cancellation_fee : 0;
          const serviceCharge = orderInfo.bill_details.service_charges;
          const cancellationCharge = (serviceCharge * cancellationPercentage) / 100;
          orderInfo.bill_details.cancellation_charge = cancellationCharge;
          orderInfo.bill_details.cancellation_fee = cancellationPercentage;

          const refundAmount = orderInfo.bill_details.total_bill - cancellationCharge
          if (user_type == 'customer') {
            const createObj = {
              user_id: user._id,
              order_id: orderInfo._id,
              amount: refundAmount,
              message: '',
              type: 'refund',
              transaction_type: 'addition',
            }
            if (userInfo.default_refund_method == 'card') {
              const chargeInfo = await this.paymentHandlerService.createCharge({ amount: refundAmount, customerId: userInfo.cards[0].customerId });
              if (chargeInfo.id && chargeInfo.status == 'succeeded') {
                const refundInfo = await this.paymentHandlerService.refundPayment({ transactionId: chargeInfo && chargeInfo.id, refundAmount: refundAmount })
                if (refundInfo.id && refundInfo.status == 'succeeded') {
                  await this.customerTransactionModel.create(createObj);
                } else {
                  throw new BadRequestException('Something went wrong')
                }
              } else {
                throw new BadRequestException('Something went wrong')
              }
            } else if (userInfo.default_refund_method == 'wallet') {
              const lessWalletAmount = userInfo.wallet_balance - refundAmount;
              await this.customerTransactionModel.create(createObj);
              await this.userModel.findOneAndUpdate({ _id: user._id }, { wallet_balance: lessWalletAmount })
            } else {
              throw new BadRequestException('No refund method available')
            }
          }

          await axios.post(process.env.NOTIFICATION_URL, {
            receiverId: user_type == 'customer' ? orderInfo.stylist_id : orderInfo.user_id,
            notification_type: user_type == 'customer' ? 'customer_cancel_order' : 'stylist_cancel_order',
            extraData: { booking_id: orderInfo.order_number },
          });

          await this.orderModel.updateOne({ _id: order_id }, {
            $set: {
              cancel_reason: reason,
              bill_details: orderInfo.bill_details,
              booking_status: 6,
            },
          });
          return this.apiResponse.successResponseWithNoData(res, 'Booking cancelled!');
        } else {
          return this.apiResponse.successResponseWithData(res, 'No Cancellation charge', {});
        }
      } else {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Order not found!');
      }
    } catch (e) {
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }

  async confirmOtpToStartService(startService: ConfirmOtpServiceDto, res: Response) {
    try {
      const { booking_id, stylist_id, otp } = startService;
      const orderInfo = await this.orderModel.findOne({ _id: booking_id });
      if (orderInfo) {
        if (parseInt(orderInfo.start_service_otp) !== parseInt(otp)) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Entered otp is wrong!');
        }
        const updateOrderData = {
          start_service_otp: null,
          booking_status: 3,
          stylist_id: stylist_id,
          started_service_at: Math.floor(Date.now()),
        };
        
        await this.orderModel.updateOne({ _id: booking_id }, { $set: updateOrderData });
        this.apiResponse.successResponseWithData(res, 'Service started!', updateOrderData);
      } else {
        return this.apiResponse.ErrorResponseWithoutData(res, 'Booking not found!');
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
      const chrg = await this.paymentHandlerService.createCharge({ amount: user.bill_details.total_bill, customerId: stripe_customer_id });
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
      await this.utilityService.sendNotificationToNearbyStylist(data, res);
      await this.orderModel.updateOne({ _id: order_id }, { $inc: { reschedule_count: 1 } });
      return this.apiResponse.successResponseWithData(res, 'Order created!', result);
    } catch (e) {
      console.log('e :>> ', e);
      return this.apiResponse.ErrorResponseWithoutData(res, e.message);
    }
  }
}
