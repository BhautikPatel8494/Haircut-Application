import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as moment from 'moment';
import * as schedule from "node-schedule"

import { CUSTOMER_PROFILE } from './constant';
import { Notifications } from 'src/Schema/notification.schema';
import { Orders } from 'src/Schema/order.schema';
import { Users } from 'src/Schema/user.schema';
import { Configs } from 'src/Schema/config.schema';
import { ServiceProviders } from 'src/Schema/serviceProvider.schema';
import { SendNotification } from './type';

@Injectable()
export class UtilityService {
  constructor(
    @InjectModel('serviceProvider') private readonly serviceProvider: Model<ServiceProviders>,
    @InjectModel('order') private readonly orderModel: Model<Orders>,
    @InjectModel('user') private readonly userModel: Model<Users>,
    @InjectModel('config') private readonly configModel: Model<Configs>,
    @InjectModel('notifications') private readonly notificationModel: Model<Notifications>,
  ) { }

  async sendNotificationToNearbyStylist(data:SendNotification) {
    let query;

    if (data.stylist_id) {
      query = {
        $match: {
          _id: new Types.ObjectId(data.stylist_id),
          city: data.city,
          blocked_customer: { $nin: [data.user_id] },
        },
      };
    } else {
      query = {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(data.lng), parseFloat(data.lat)],
          },
          key: 'location',
          distanceField: 'distance',
          distanceMultiplier: 0.001,
          spherical: true,
        },
      };
    }
    const user = await this.serviceProvider.aggregate([query,
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
    ])
    if (user.length <= 0) {
      console.log('no stylist nearby');
    }
    let config = await this.configModel.findOne();
    let counter = 0;
    for (let i = 0; i < user.length; i++) {
      const orderInfo = await this.orderModel.aggregate([{ $match: { stylist_id: user[i]._id, booking_status: { $in: [1, 2, 3, 5] } } }]); // Only send notification if order is not completed
      const userInfo = await this.userModel.findOne({ _id: data.user_id, blocked_stylist: { $elemMatch: { stylist_id: user[i]._id, block_status: 'active' } } });
      const juniorArray = ['junior'];
      const seniorArray = ['junior', 'senior'];
      if (orderInfo.length > 0) {
      } else if (userInfo) {
        console.log(user[i], 'this stylist is block listed by customer!');
      } else if (!data.stylist_id && user[i].online === 0) {
        // if stylist status is not online
        // console.log(user[i], 'stylist is not online');
      } else if (user[i].blocked_customer.length > 0 && user[i].blocked_customer.indexOf(data.user_id) >= 0) {
        // if user is blocked by stylist
        console.log(user[i], 'this customer is block listed by stylist');
      } else if (!data.stylist_id && user[i].experience == 'junior' && !juniorArray.includes(data.stylist_level)) {
        // console.log(user[i], 'this order not valid for junior stylist');
      } else if (!data.stylist_id && user[i].experience == 'senior' && !seniorArray.includes(data.stylist_level)) {
        // console.log(user[i], 'this order not valid for junior and senior stylist');
      } else {
        let order_type;
        if (data.booking_type === 'On-Demand Order' || data.booking_type === 'Custom Order') {
          order_type = 'on-demand';
        } else if (data.booking_type === 'Scheduled Order') {
          order_type = 'scheduled';
        }

        let notification = {
          notification_type: data.notification_type ? data.notification_type : '',
          distance: `${user[i].distance}` != 'undefined' ? `${user[i].distance}` : '',
          date: data.created_at ? data.created_at : '',
          name: data.full_name ? data.full_name : '',
          profile: data.profile ? data.profile : '',
          total_price: data.total_price ? data.total_price : '',
          booking_type: data.booking_type ? data.booking_type : '',
          order_id: data.order_id ? data.order_id.toString() : '',
        };

        let stylist_notification = {
          user: {
            user_id: data.user_id,
            full_name: data.full_name,
            profile: data.profile ? CUSTOMER_PROFILE + data.profile : '',
          },
          stylist_id: user[i]._id,
          message: data.message,
          is_service_request: true,
          type: order_type,
          order_id: data.order_id,
        };
        await this.notificationModel.create(stylist_notification)
        if (!data.is_custom && data.stylist_id === user[i]._id.toString()) {
          axios.post(process.env.NOTIFICATION_URL, {
            receiverId: user[i]._id,
            notification_type: 'preffered_stylist_confirmation',
            extraData: {
              ...notification,
              stylist_firstname: user[i].firstname,
              stylist_lastname: user[i].lastname,
            },
          });

          const expireTime = config.service_request_expiration_duration / 60;
          const example = 60 / 60;
          const isoDate = moment().add(expireTime, 'minute').toDate();
          schedule.scheduleJob(isoDate, () => {
            axios.post(process.env.NOTIFICATION_URL, {
              receiverId: user[i]._id,
              notification_type: 'preffered_stylist_request_expired',
              extraData: {
                stylist_firstname: user[i].firstname,
                stylist_lastname: user[i].lastname,
              },
            });
          });
        }

        if (data.is_custom && data.stylist_id === user[i]._id.toString()) {
          axios.post(process.env.NOTIFICATION_URL, {
            receiverId: user[i]._id,
            notification_type: 'direct_stylist_confirmation',
            extraData: {
              ...notification,
              stylist_firstname: user[i].firstname,
              stylist_lastname: user[i].lastname,
            },
          });

          const expireTime = config.service_request_expiration_duration / 60;
          const example = 60 / 60;
          const isoDate = moment().add(expireTime, 'minute').toDate();
          schedule.scheduleJob(isoDate, () => {
            axios.post(process.env.NOTIFICATION_URL, {
              receiverId: user[i]._id,
              notification_type: 'custom_request_expired',
              extraData: {
                stylist_firstname: user[i].firstname,
                stylist_lastname: user[i].lastname,
              },
            });
          });
        }

        if (!data.stylist_id) {
          axios.post(process.env.NOTIFICATION_URL, {
            receiverId: user[i]._id,
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
      const example = 60 / 60;
      const isoDate = moment().add(expireTime, 'minute').toDate();
      schedule.scheduleJob(isoDate, () => {
        console.log('On Demand Booking Called!!');
        axios.post(process.env.NOTIFICATION_URL, {
          receiverId: data.user_id,
          notification_type: 'on_demand_request_expired',
          extraData: {},
        });
      });
    }
  }
}
