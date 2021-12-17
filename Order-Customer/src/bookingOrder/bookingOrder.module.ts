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
      { name: 'serviceProvider', schema: ServiceProviderSchema },
      { name: 'order', schema: OrderSchema },
      { name: 'schedules', schema: ScheduleSchema },
      { name: 'user', schema: UserSchema },
      { name: 'customerCarts', schema: CustomerCartSchema },
      { name: 'deviceNotification', schema: DeviceNotificationSchema },
      { name: 'customerTransaction', schema: CustomerTransactionSchema },
      { name: 'config', schema: ConfigSchema },
      { name: 'notifications', schema: NotificationSchema },
      { name: 'cancellationRule', schema: CancellationRuleSchema },
    ]),
  ],
  controllers: [BookingOrderController],
  providers: [BookingOrderService, ApiResponse, UtilityService],
})
export class BookingOrderModule { }
