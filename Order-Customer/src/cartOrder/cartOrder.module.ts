import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigSchema } from 'src/Schema/config.schema';
import { CustomerCartSchema } from 'src/Schema/customerCart.schema';
import { CustomServiceSchema } from 'src/Schema/customService.schema';
import { ServiceSchema } from 'src/schema/service.schema';
import { UserSchema } from 'src/Schema/user.schema';
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
