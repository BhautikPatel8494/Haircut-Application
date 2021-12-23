import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
class addOns {
  @Prop({ type: Types.ObjectId })
  service_id: Types.ObjectId;

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

const addOnSchema = SchemaFactory.createForClass(addOns)

@Schema()
export class BillDetails {
  @Prop({ type: Number, default: 0 })
  total_service: number;

  @Prop({ type: Number, default: 0 })
  service_charges: number;

  @Prop({ type: Number, default: 0 })
  convenience_fee: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: String })
  voucher: string;

  @Prop({ type: Number, default: 0 })
  voucher_amount: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  total_bill: number;

  @Prop({ type: Number, default: 0 })
  wallet_amount_used: number;

  @Prop({ type: Number, default: 0 })
  card_amount_used: number;

  @Prop({ type: Number, default: 0 })
  cancellation_charge: number;

  @Prop({ type: Number, default: 0 })
  cancellation_fee: number;
}

const BillDetailSchema = SchemaFactory.createForClass(BillDetails);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'orders' })
export class Orders {
  _id?: string;

  @Prop({ type: String, required: true })
  order_number: string;

  @Prop({ type: Types.ObjectId, required: true })
  user_id: Types.ObjectId;

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

  @Prop({ type: String, default: new Date().getTime() })
  date: string;

  @Prop({ type: Object, default: {} })
  selected_slot: {
    from_time: string,
    to_time: string
  };

  @Prop({ type: Types.ObjectId })
  stylist_id: string;

  @Prop({ type: Array, required: true })
  cart: [];

  @Prop({ type: Object, required: true })
  active_location: object;

  @Prop({ type: [addOnSchema], default: [] })
  add_ons: [addOns];

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  booking_type: number;

  @Prop({ type: Array, default: [] })
  order_rejected_by: [string];

  @Prop({ type: Number, default: 0 })
  reschedule_count: number;

  @Prop({ type: BillDetailSchema, required: true })
  bill_details: BillDetails;

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

  created_at: string;
  updated_at: string;
}

export const OrderSchema = SchemaFactory.createForClass(Orders);
