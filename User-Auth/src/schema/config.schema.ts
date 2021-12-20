import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Schedules {
  @Prop({ type: Number })
  day: number;

  @Prop({ type: String, required: true })
  start_time: string;

  @Prop({ type: String, required: true })
  end_time: string;

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  disable: number;
}

const ScheduleSchema = SchemaFactory.createForClass(Schedules);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'configs' })
export class Configs {
  @Prop({ type: Number, default: 0 })
  customer_stylist_radius: number;

  @Prop({ type: Number, default: 0 })
  service_request_limit: number;

  @Prop({ type: Number, default: 0 })
  booking_reschedule_limit: number;

  @Prop({ type: Number, default: 0 })
  service_request_expiration_duration: number;

  @Prop({ type: Number, default: 0 })
  stylist_earning_withdrawal_threshold: number;

  @Prop({ type: Number, default: 0 })
  stylist_earning_withdrawal_limit: number;

  @Prop({ type: Number })
  platform_commissions: number;

  @Prop({ type: Number })
  platform_convenience_fees: number;

  @Prop({ type: Number })
  platform_service_tax: number;

  @Prop({ type: Object })
  customer: object;

  @Prop({ type: Object })
  stylist: object;

  @Prop({ type: [ScheduleSchema], default: [] })
  schedule: [Schedules];
}

export const ConfigSchema = SchemaFactory.createForClass(Configs);
