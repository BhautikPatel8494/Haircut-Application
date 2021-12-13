import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer_CartSchema } from 'src/Schema/cartModel.schema';
import { CustomServiceSchema } from 'src/Schema/customService.schema';
import { ConfigSchema } from 'src/Schema/globalSettings.schema';
import { ServiceSchema } from 'src/Schema/serviceModel.schema';
import { UserSchema } from 'src/Schema/userModel.schema';
import { ApiResponse } from 'src/utils/apiResponse.service';
import { CartOrderController } from './cartOrder.controller';
import { CartOrderService } from './cartOrder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Customer_Cart', schema: Customer_CartSchema },
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
