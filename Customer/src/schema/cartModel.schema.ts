import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type CartModeltype = Customer_Cart & Document;

@Schema()
export class CartItemSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  service_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 0 })
  regular_price: number;

  @Prop({ type: Number, default: 0 })
  sale_price: number;

  @Prop({ type: Boolean, default: false })
  is_custom: boolean;

  @Prop({ type: Number, required: true })
  quantity: number;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CartProfileSchema {
  @Prop({ type: String, required: true })
  firstname: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String })
  profile: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  profile_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  user_type: string;

  @Prop()
  cart_items: [CartItemSchema];
}

@Schema()
export class BillDetailSchema {
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
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Customer_Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users', required: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  stylist_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  location_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  service_category_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  stylist_type: string;

  @Prop({ type: String, enum: ["simple-service", "custom-service"], default: "simple-service" })
  service_type: string;

  @Prop()
  cart_profiles: [CartProfileSchema];

  @Prop()
  bill_details: BillDetailSchema;
}

export const Customer_CartSchema = SchemaFactory.createForClass(Customer_Cart);
