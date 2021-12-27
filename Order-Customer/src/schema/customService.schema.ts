import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'custom_services' })
export class CustomServices {
  @Prop({ type: String, required: true, unique: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'service_providers',
    required: true,
  })
  stylist_id: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'categories',
    required: true,
  })
  category_id: string;

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

  created_at: string;
  updated_at: string;
}

export const CustomServiceSchema = SchemaFactory.createForClass(CustomServices);
