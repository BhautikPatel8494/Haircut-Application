import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type Customer_TransactionModelType = Customer_Transaction & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Customer_Transaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  order_id: MongooseSchema.Types.ObjectId;

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
}

export const Customer_TransactionSchema = SchemaFactory.createForClass(Customer_Transaction);
