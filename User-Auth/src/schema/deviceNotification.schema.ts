import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';


@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'device_notifications' })
export class DeviceNotification {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: '' })
  body: string;

  @Prop({ type: String, default: '' })
  type: string;

  created_at: string;
  updated_at: string;
}

export const DeviceNotificationSchema = SchemaFactory.createForClass(DeviceNotification);
