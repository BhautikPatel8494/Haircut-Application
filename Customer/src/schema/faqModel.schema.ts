import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

export type FaqModeltype = FaqModel & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class FaqModel {
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
}

export const FaqSchema = SchemaFactory.createForClass(FaqModel);