import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'customer_transactions' })
export class CustomerTransactions {
  @Prop({ type: Types.ObjectId, required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  order_id: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: String, default: '' })
  message: string;

  @Prop({
    type: String,
    enum: ['refund', 'reward', 'payment', 'order-deduction'],
    default: 'refund',
  })
  type: string;

  @Prop({ type: String, enum: ['addition', 'deduction'], default: 'deduction' })
  transaction_type: string;

  created_at: string;
  updated_at: string;
}

export const CustomerTransactionSchema = SchemaFactory.createForClass(CustomerTransactions);
