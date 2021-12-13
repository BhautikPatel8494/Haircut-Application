import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type cancellationRuleType = Cancellation_rule & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Cancellation_rule {
  
  @Prop({ type: String, enum: ['after', 'before'], required: true })
  cancel_type: string;

  @Prop({
    type: String,
    enum: [
      'not_assigned',
      'stylist_assigned',
      'reached_location',
      'start_service',
    ],
    required: true,
  })
  order_status: string;

  @Prop({ type: String, required: true, enum: ['customer', 'stylist'] })
  types: string;

  @Prop({ type: Number, required: true })
  cancellation_fee: number;

  @Prop({
    type: String,
    required: true,
    enum: ['on_demand_service', 'scheduled_service'],
  })
  service_type: string;

  @Prop({ type: Number, default: null })
  elapsed_time: number;
}

export const cancellationRuleSchema =
  SchemaFactory.createForClass(Cancellation_rule);
