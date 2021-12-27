import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CancellationRuleSchema } from '../schema/cancellationRule.schema';
import { ConfigSchema } from '../schema/config.schema';
import { CustomerCartSchema } from '../schema/customerCart.schema';
import { CustomerTransactionSchema } from '../schema/customerTransaction.schema';
import { DeviceNotificationSchema } from '../schema/deviceNotification.schema';
import { NotificationSchema } from '../schema/notification.schema';
import { OrderSchema } from '../schema/order.schema';
import { ScheduleSchema } from '../schema/schedule.schema';
import { ServiceProviderSchema } from '../schema/serviceProvider.schema';
import { UserSchema } from '../schema/user.schema';
import { ApiResponse } from '../utils/apiResponse.service';
import { PaymentHandlerService } from '../utils/paymentHandler.service';
import { UtilityService } from '../utils/utility.service';
import { BookingOrderController } from './bookingOrder.controller';
import { BookingOrderService } from './bookingOrder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServiceProvider', schema: ServiceProviderSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Schedule', schema: ScheduleSchema },
      { name: 'User', schema: UserSchema },
      { name: 'CustomerCart', schema: CustomerCartSchema },
      { name: 'DeviceNotification', schema: DeviceNotificationSchema },
      { name: 'CustomerTransaction', schema: CustomerTransactionSchema },
      { name: 'Config', schema: ConfigSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'CancellationRule', schema: CancellationRuleSchema },
    ]),
  ],
  controllers: [BookingOrderController],
  providers: [BookingOrderService, ApiResponse, UtilityService, PaymentHandlerService],
})
export class BookingOrderModule { }
