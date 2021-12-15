import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CancellationRuleSchema } from 'src/Schema/cancellationRule.schema';
import { ConfigSchema } from 'src/Schema/config.schema';
import { CustomerCartSchema } from 'src/Schema/customerCart.schema';
import { CustomerTransactionSchema } from 'src/Schema/customerTransaction.schema';
import { DeviceNotificationSchema } from 'src/Schema/deviceNotification.schema';
import { NotificationSchema } from 'src/Schema/notification.schema';
import { OrderSchema } from 'src/Schema/order.schema';
import { ScheduleSchema } from 'src/Schema/schedule.schema';
import { ServiceProviderSchema } from 'src/Schema/serviceProvider.schema';
import { UserSchema } from 'src/Schema/user.schema';
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
      { name: 'Config', schema: ConfigSchema },
      { name: 'notifications', schema: NotificationSchema },
      { name: 'cancellationRule', schema: CancellationRuleSchema },
    ]),
  ],
  controllers: [BookingOrderController],
  providers: [BookingOrderService, ApiResponse, UtilityService],
})
export class BookingOrderModule { }
