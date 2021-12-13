import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type Device_NotificationModelType = Device_notification & Document;

@Schema()
export class Device_notification {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: '' })
  body: string;

  @Prop({ type: String, default: '' })
  type: string;
}

export const DeviceNotificationSchema = SchemaFactory.createForClass(Device_notification);
