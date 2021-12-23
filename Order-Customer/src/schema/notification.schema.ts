import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'notifications' })
export class Notifications {
  @Prop({ type: Object })
  user: {
    user_id: { type: string };
    full_name: { type: string };
    profile: { type: string };
  };

  @Prop({ type: Types.ObjectId, required: true })
  stylist_id: string;

  @Prop({ type: String, default: '' })
  message: string;

  @Prop({ type: Boolean, default: false })
  is_service_request: boolean;

  @Prop({ type: Types.ObjectId })
  order_id: string;

  @Prop({ type: Boolean, default: false })
  seen: boolean;

  @Prop({
    type: String,
    enum: ['on-demand', 'scheduled', 'rejected'],
    required: true,
  })
  type: string;

  created_at: string;
  updated_at: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notifications);
