import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Utility } from '../utils/utility.service';
import { ApiResponse } from '../utils/apiResponse.service';
import { PaymentHandlerService } from '../utils/paymentHandler.service';
import { ServiceProviderSchema } from '../schema/serviceProvider.schema';
import { ConnectedAccountSchema } from '../schema/connectedAccount.schema';
import { StylistTransferSchema } from '../schema/stylistTransfer.schema';
import { UserSchema } from '../schema/user.schema';
import { OrderSchema } from '../schema/order.schema';
import { CustomerTransactionSchema } from '../schema/customerTransaction.schema';
import { CancellationRuleSchema } from '../schema/cancellationRule.schema';
import { EmergencyCancellationSchema } from '../schema/emergencyCancellation.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'User', schema: UserSchema },
    { name: 'ServiceProvider', schema: ServiceProviderSchema },
    { name: 'Order', schema: OrderSchema },
    { name: 'ConnectedAccount', schema: ConnectedAccountSchema },
    { name: 'CustomerTransaction', schema: CustomerTransactionSchema },
    { name: 'CancellationRule', schema: CancellationRuleSchema },
    { name: 'EmergencyCancellation', schema: EmergencyCancellationSchema },
    { name: 'StylistTransfer', schema: StylistTransferSchema }
  ])],
  controllers: [PaymentController],
  providers: [PaymentService, ApiResponse, Utility, PaymentHandlerService],
})
export class PaymentModule { }
