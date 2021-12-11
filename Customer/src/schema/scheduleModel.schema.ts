import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type ScheduleModelType = Schedule & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ScheduleTimesSchema {
  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: String, required: true })
  start_time: string;

  @Prop({ type: String, required: true })
  end_time: string;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ScheduledDaysSchema {
  @Prop({ type: Number, required: true })
  day: number;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop()
  scheduled_times: [ScheduleTimesSchema];
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Schedule {
  @Prop({ type: String, required: true })
  schedule_type: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'service_providers',
    required: true,
  })
  stylist_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Number })
  week: number;

  @Prop()
  scheduled_days: [ScheduledDaysSchema];
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
