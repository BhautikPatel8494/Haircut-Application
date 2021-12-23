import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as moment from 'moment';
import * as schedule from "node-schedule"

import { CUSTOMER_PROFILE } from './constant';
import { Notifications } from 'src/schema/notification.schema';
import { Orders } from 'src/schema/order.schema';
import { Users } from 'src/schema/user.schema';
import { Configs } from 'src/schema/config.schema';
import { ServiceProviders } from 'src/schema/serviceProvider.schema';
import { SendNotification } from './type';
import { Response } from 'express';
import { ApiResponse } from './apiResponse.service';

@Injectable()
export class UtilityService {
  constructor(
    @InjectModel('ServiceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
    @InjectModel('Order') private readonly orderModel: Model<Orders>,
    @InjectModel('User') private readonly userModel: Model<Users>,
    @InjectModel('Config') private readonly configModel: Model<Configs>,
    @InjectModel('Notification') private readonly notificationModel: Model<Notifications>,
    private readonly apiResponse: ApiResponse,
  ) { }

  async sendNotificationToNearbyStylist(data: SendNotification, res: Response) {
    let onlineQuery = [];
    let offlineQuery = [];

    if (data.stylist_id) {
      onlineQuery.push({ $match: { _id: new Types.ObjectId(data.stylist_id), city: data.city, blocked_customer: { $nin: [data.user_id] } } });
    } else {
      onlineQuery.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(data.lng), parseFloat(data.lat)],
          },
          key: 'live_location',
          query: {
            online: 1,
            registration_status: 'accepted',
            status: true,
            deleted: false
          },
          distanceField: 'distance',
          distanceMultiplier: 0.001,
          spherical: true,
        },
      });

      offlineQuery.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(data.lng), parseFloat(data.lat)],
          },
          key: 'register_location',
          query: {
            online: 0,
            registration_status: 'accepted',
            status: true,
            deleted: false
          },
          distanceField: 'distance',
          distanceMultiplier: 0.001,
          spherical: true,
        },
      });
    }

    const resultQuery = [
      {
        $lookup: {
          from: 'orders',
          let: {
            stylist_id: '$_id',
            current_hour: {
              $concat: [new Date().getHours().toString(), ':', new Date().getMinutes().toString()],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$stylist_id', '$$stylist_id'] },
                    { $eq: ['$booking_type', 1] },
                    { $eq: ['$booking_status', 0] },
                    { $lte: ['$selected_slot.from_time', '$$current_hour'] },
                    { $gte: ['$selected_slot.to_time', '$$current_hour'] },
                    {
                      $lt: ['$date', new Date(new Date().setHours(23, 59, 59))],
                    },
                    { $gte: ['$date', new Date(new Date().setHours(0, 0, 0))] },
                  ],
                },
              },
            },
            {
              $project: { _id: 1 },
            },
          ],
          as: 'orders',
        },
      },
      {
        $project: {
          distance: 1,
          orders: 1,
          experience: 1,
          firstname: 1,
          lastname: 1,
          devices: 1,
          online: 1,
          blocked_customer: 1,
          within: { $gte: ['$radius', '$distance'] },
        },
      },
      { $match: { within: true, orders: { $size: 0 } } },
    ];

    onlineQuery = onlineQuery.concat(resultQuery);
    offlineQuery = offlineQuery.concat(resultQuery);

    const onlineStylists = await this.serviceProviderModel.aggregate(onlineQuery);
    const offlineStylists = await this.serviceProviderModel.aggregate(offlineQuery);
    let stylist = onlineStylists.concat(offlineStylists);
    if (data.stylist_id) {
      stylist = onlineStylists;
    }
    if (stylist.length <= 0) {
      console.log('no stylist nearby');
    }
    let config = await this.configModel.findOne();
    let counter = 0;
    for (let i = 0; i < stylist.length; i++) {
      const result = stylist[i];
      const orderInfo = await this.orderModel.aggregate([{ $match: { stylist_id: result._id, booking_status: { $in: [1, 2, 3, 5] } } }]); // Only send notification if order is not completed
      const userInfo = await this.userModel.findOne({ _id: data.user_id, blocked_stylist: { $elemMatch: { stylist_id: result._id, block_status: 'active' } } });
      const juniorArray = ['junior'];
      const seniorArray = ['junior', 'senior'];

      if (data.stylist_id && orderInfo.length > 0) {
        await this.orderModel.deleteOne({ _id: data.order_id });
        throw new Error('Stylist is have an active order!');
      } else if (orderInfo.length > 0) {
        console.log(result, 'Stylist is have an active order!');
      } else if (userInfo) {
        console.log(result, 'this stylist is block listed by customer!');
      } else if (result.blocked_customer.length > 0 && result.blocked_customer.indexOf(data.user_id) >= 0) {
        console.log(result, 'this customer is block listed by stylist');
      } else if (!data.stylist_id && result.experience == 'junior' && !juniorArray.includes(data.stylist_level)) {
        console.log(result, 'this order not for junior stylist');
      } else if (!data.stylist_id && result.experience == 'senior' && !seniorArray.includes(data.stylist_level)) {
        console.log(result, 'this order not for junior and senior stylist');
      } else {
        let order_type = "";
        if (data.booking_type == 'on-demand' || data.booking_type >= 'custom') {
          order_type = 'on-demand';
        } else if (data.booking_type === 'on-scheduled') {
          order_type = 'scheduled';
        }

        const notification = {
          notification_type: data.notification_type ? data.notification_type : '',
          distance: `${result.distance}` != 'undefined' ? `${result.distance}` : '',
          date: data.created_at ? data.created_at : '',
          name: data.full_name ? data.full_name : '',
          profile: data.profile ? data.profile : '',
          total_price: data.total_price ? data.total_price : '',
          booking_type: data.booking_type ? data.booking_type : '',
          order_id: data.order_id ? data.order_id.toString() : '',
        };

        const stylist_notification = {
          user: {
            user_id: data.user_id,
            full_name: data.full_name,
            profile: data.profile ? CUSTOMER_PROFILE + data.profile : '',
          },
          stylist_id: result._id,
          message: data.message,
          is_service_request: true,
          type: order_type,
          order_id: data.order_id,
        };
        await this.notificationModel.create(stylist_notification)

        if (!data.is_custom && data.stylist_id === result._id.toString()) {
          await axios.post(process.env.NOTIFICATION_URL, {
            receiverId: result._id,
            notification_type: 'preffered_stylist_confirmation',
            extraData: {
              ...notification,
              stylist_firstname: result.firstname,
              stylist_lastname: result.lastname,
            },
          });

          const expireTime = config.service_request_expiration_duration / 60;
          const isoDate = moment().add(expireTime, 'minute').toDate();
          schedule.scheduleJob(isoDate, async () => {
            await axios.post(process.env.NOTIFICATION_URL, {
              receiverId: result._id,
              notification_type: 'preffered_stylist_request_expired',
              extraData: {
                stylist_firstname: result.firstname,
                stylist_lastname: result.lastname,
              },
            });
          });
        }

        if (data.is_custom && data.stylist_id === result._id.toString()) {
          await axios.post(process.env.NOTIFICATION_URL, {
            receiverId: result._id,
            notification_type: 'direct_stylist_confirmation',
            extraData: {
              ...notification,
              stylist_firstname: result.firstname,
              stylist_lastname: result.lastname,
            },
          });

          const expireTime = config.service_request_expiration_duration / 60;
          const isoDate = moment().add(expireTime, 'minute').toDate();
          schedule.scheduleJob(isoDate, async () => {
            await axios.post(process.env.NOTIFICATION_URL, {
              receiverId: result._id,
              notification_type: 'custom_request_expired',
              extraData: {
                stylist_firstname: result.firstname,
                stylist_lastname: result.lastname,
              },
            });
          });
        }

        if (!data.stylist_id) {
          await axios.post(process.env.NOTIFICATION_URL, {
            receiverId: result._id,
            notification_type: 'order_waiting_confirmation',
            extraData: notification,
          });
        }
      }
      counter++;
      if (counter > config.service_request_limit) {
        break;
      }
    }

    if (!data.stylist_id) {
      const expireTime = config.service_request_expiration_duration / 60;
      const isoDate = moment().add(expireTime, 'minute').toDate();
      schedule.scheduleJob(isoDate, async () => {
        console.log('On Demand Booking Called!!');
        await axios.post(process.env.NOTIFICATION_URL, {
          receiverId: data.user_id,
          notification_type: 'on_demand_request_expired',
          extraData: {},
        });
      });
    }
    return this.apiResponse.successResponse(res, 'Booking created successfully!')
  }
}
