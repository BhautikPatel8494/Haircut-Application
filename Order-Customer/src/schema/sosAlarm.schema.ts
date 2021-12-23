import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UpdateSosAlarms {
    @Prop({ type: Types.ObjectId, required: true })
    responsible: string;

    @Prop({ type: String, enum: ['stylist', 'admin', 'customer'], required: true })
    responsible_type: string;

    @Prop({ type: String, enum: ['create', 'update_location', 'cancel'], required: true })
    action: string;

    @Prop({ type: Object })
    data: {
        lat: { type: number },
        lon: { type: number },
        accuracy: { type: number },
    }
}

const UpdateSosAlarmSchema = SchemaFactory.createForClass(UpdateSosAlarms);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'sos_alarms' })
export class SosAlarms {
    @Prop({ type: Types.ObjectId, required: true })
    user_id: string;

    @Prop({ type: String, enum: ['stylist', 'customer'], required: true })
    type: string;

    @Prop({ type: String, required: true })
    alarm_id: string;

    @Prop({ type: String, default: 'ACTIVE' })
    status: string;

    @Prop({ type: [UpdateSosAlarmSchema], default: 'ACTIVE' })
    updates: [UpdateSosAlarms]
}

export const SosAlarmSchema = SchemaFactory.createForClass(SosAlarms);
