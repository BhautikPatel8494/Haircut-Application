import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'faqs' })
export class Faqs {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Array, default: [] })
  section: [];

  @Prop({ type: Boolean, default: false })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  disable: boolean;

  @Prop({ type: Array, default: [] })
  assign_for: [];

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  created_at: string;
  updated_at: string;
}

export const FaqSchema = SchemaFactory.createForClass(Faqs);