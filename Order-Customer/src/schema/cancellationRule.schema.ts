import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },collection: 'Cancellation_rule' })
export class CancellationRule {
  
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

  created_at: string;
  updated_at: string;
}

export const CancellationRuleSchema =
  SchemaFactory.createForClass(CancellationRule);
