import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'emergency_cancellations' })
export class EmergencyCancellations {
    @Prop({ type: String, enum: ['stylist', 'customer'], default: 'stylist' })
    type: string;

    @Prop({ type: Number, required: true })
    reason_id: string;

    @Prop({ type: String, required: true })
    reason: string;

    @Prop({ type: Number, required: true })
    cancellationFee: number;

    created_at: string;
    updated_at: string;
}

export const EmergencyCancellationSchema = SchemaFactory.createForClass(EmergencyCancellations);