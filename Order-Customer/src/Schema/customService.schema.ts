import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type CustomServiceType = Custom_service & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Custom_service {
  @Prop({ type: String, required: true, unique: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'service_providers',
    required: true,
  })
  stylist_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'categories',
    required: true,
  })
  category_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  regular_price: number;

  @Prop({ type: Number, default: 0 })
  sale_price: number;

  @Prop({ type: Array, default: [] })
  available_for: [];

  @Prop({ type: Array, default: [] })
  images: [];

  @Prop({ type: Array, default: [] })
  videos: [];

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Boolean, default: false })
  disable: boolean;

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ type: Number, default: 0 })
  approved: number;

  @Prop({ type: Boolean, default: true })
  editable: boolean;
}

export const CustomServiceSchema = SchemaFactory.createForClass(Custom_service);
