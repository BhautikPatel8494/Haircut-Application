import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigSchema } from 'src/schema/config.schema';
import { CustomerCartSchema } from 'src/schema/customerCart.schema';
import { CustomServiceSchema } from 'src/schema/customService.schema';
import { ServiceSchema } from 'src/schema/service.schema';
import { UserSchema } from 'src/schema/user.schema';
import { ApiResponse } from 'src/utils/apiResponse.service';
import { CartOrderController } from './cartOrder.controller';
import { CartOrderService } from './cartOrder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'customerCart', schema: CustomerCartSchema },
      { name: 'customService', schema: CustomServiceSchema },
      { name: 'service', schema: ServiceSchema },
      { name: 'user', schema: UserSchema },
      { name: 'config', schema: ConfigSchema },
    ]),
  ],
  providers: [CartOrderService,ApiResponse],
  controllers: [CartOrderController],
})
export class CartOrderModule {}
