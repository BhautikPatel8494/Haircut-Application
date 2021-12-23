import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CancellationRuleSchema } from 'src/schema/cancellationRule.schema';
import { ConfigSchema } from 'src/schema/config.schema';
import { CustomerCartSchema } from 'src/schema/customerCart.schema';
import { CustomerTransactionSchema } from 'src/schema/customerTransaction.schema';
import { DeviceNotificationSchema } from 'src/schema/deviceNotification.schema';
import { NotificationSchema } from 'src/schema/notification.schema';
import { OrderSchema } from 'src/schema/order.schema';
import { ScheduleSchema } from 'src/schema/schedule.schema';
import { ServiceProviderSchema } from 'src/schema/serviceProvider.schema';
import { UserSchema } from 'src/schema/user.schema';
import { ApiResponse } from 'src/utils/apiResponse.service';
import { UtilityService } from 'src/utils/utility.service';
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
  providers: [BookingOrderService, ApiResponse, UtilityService],
})
export class BookingOrderModule { }
