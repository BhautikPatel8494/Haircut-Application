import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ScheduleTimes {
  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: String, required: true })
  start_time: string;

  @Prop({ type: String, required: true })
  end_time: string;

  created_at: string;
  updated_at: string;
}

const ScheduleTimeSchema = SchemaFactory.createForClass(ScheduleTimes);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ScheduleDays {
  @Prop({ type: Number, required: true })
  day: number;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: [ScheduleTimeSchema], default: [] })
  scheduled_times: [ScheduleTimes];

  created_at: string;
  updated_at: string;
}

const ScheduleDaysSchema = SchemaFactory.createForClass(ScheduleDays);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'schedules' })
export class Schedules {
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

  @Prop({ type: [ScheduleDaysSchema], default: [] })
  scheduled_days: [ScheduleDays];

  created_at: string;
  updated_at: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedules);
