import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type NotificationModelType = NotificationModel & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class NotificationModel {
  @Prop()
  user: {
    user_id: { type: MongooseSchema.Types.ObjectId };
    full_name: { type: String };
    profile: { type: String };
  };

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  stylist_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, default: '' })
  message: string;

  @Prop({ type: Boolean, default: false })
  is_service_request: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  order_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  seen: boolean;

  @Prop({
    type: String,
    enum: ['on-demand', 'scheduled', 'rejected'],
    required: true,
  })
  type: string;
}

export const NotificationModelSchema = SchemaFactory.createForClass(NotificationModel);
