import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type OrderModelType = Order & Document;

@Schema()
export class addOnSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  service_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  title: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Number, default: 0 })
  regular_price: number;

  @Prop({ type: Number, default: 0 })
  sale_price: number;

  @Prop({ type: Number })
  quantity: number;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Order {
  @Prop({ type: String, required: true })
  order_number: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], default: 0 })
  booking_status: number;

  @Prop({
    type: String,
    enum: ['customer', 'stylist', ''],
    default: ''
  })
  cancel_user_type: string;

  @Prop({ type: String, default: '' })
  cancel_reason: string;

  @Prop({ type: Boolean, default: false })
  wallet_used: boolean;

  @Prop({ type: String, default: null })
  start_service_otp: string;

  @Prop({ type: Number, enum: [0, 1, 2, 3], default: 0 })
  payment_status: number;

  @Prop({
    type: Number,
    enum: [0, 1],
    default: 0,
  })
  direct_order: number;

  @Prop({ type: Number, default: new Date().getTime() })
  date: number;

  @Prop({ type: Object, default: {} })
  selected_slot: object;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  stylist_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Array, required: true })
  cart: [];

  @Prop({ type: Object, required: true })
  active_location: object;

  @Prop()
  add_ons: [addOnSchema];

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  booking_type: number;

  @Prop({ type: Array, default: [] })
  order_rejected_by: [];

  @Prop({ type: Number, default: 0 })
  reschedule_count: number;

  @Prop({ type: Object, required: true })
  bill_details: object;

  @Prop({ type: Number, default: 0 })
  wallet_amount_used: number;

  @Prop({ type: String, default: null })
  order_accepted_at: string;

  @Prop({ type: String, default: null })
  reached_location_at: string;

  @Prop({ type: String, default: null })
  started_service_at: string;

  @Prop({ type: String, required: true })
  stripe_customer_id: string;

  @Prop({ type: String })
  charge_id: string;

  @Prop({ type: String, default: null })
  addons_charge_id: string;

  @Prop({ type: String, default: null })
  completed_at: string;

  @Prop()
  expired_at: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
