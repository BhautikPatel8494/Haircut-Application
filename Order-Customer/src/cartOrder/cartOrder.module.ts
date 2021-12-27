import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigSchema } from '../schema/config.schema';
import { CustomerCartSchema } from '../schema/customerCart.schema';
import { CustomServiceSchema } from '../schema/customService.schema';
import { ServiceSchema } from '../schema/service.schema';
import { UserSchema } from '../schema/user.schema';
import { ApiResponse } from '../utils/apiResponse.service';
import { CartOrderController } from './cartOrder.controller';
import { CartOrderService } from './cartOrder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CustomerCart', schema: CustomerCartSchema },
      { name: 'CustomService', schema: CustomServiceSchema },
      { name: 'Service', schema: ServiceSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Config', schema: ConfigSchema },
    ]),
  ],
  providers: [CartOrderService,ApiResponse],
  controllers: [CartOrderController],
})
export class CartOrderModule {}
