import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type ServiceModelType = Service & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Service {
  @Prop({ type: String, required: true, unique: true })
  title: string;

  @Prop({ type: String, default: '' })
  permalink: string;

  @Prop({ type: Number, default: 0 })
  duration: number;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Array, default: [] })
  age_group: [];

  @Prop({ type: Array, default: [] })
  stylist_type: [];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'categories',
    required: true,
  })
  category_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'categories.sub_categories',
    required: true,
  })
  subcategory_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  regular_price: number;

  @Prop({ type: Number, default: 0 })
  sale_price: number;

  @Prop({ type: Number, default: 0 })
  quantity: number;

  @Prop({ type: String, default: '' })
  featured_image: string;

  @Prop({ type: String, default: '' })
  section_image: string;

  @Prop({ type: String, default: '' })
  note: string;

  @Prop({ type: Array, default: [] })
  images: [];

  @Prop({ type: Array, default: [] })
  videos: [];

  @Prop({ type: Array, default: [] })
  parent_location: [];

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Boolean, default: false })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  disable: boolean;

  @Prop({ type: String, default: '' })
  seo_title: string;

  @Prop({ type: String, default: '' })
  seo_description: string;

  @Prop({ type: Array, default: [] })
  seo_index: [];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
