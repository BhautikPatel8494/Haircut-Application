import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'ratings' })
export class Ratings {
    @Prop({ type: Types.ObjectId, required: true })
    user_id: string;

    @Prop({ type: Types.ObjectId })
    stylist_id: string;

    @Prop({ type: Types.ObjectId })
    custom_service_id: string;

    @Prop({ type: String, enum: ['On-Demand', 'Regular'] })
    order_type: string;

    @Prop({ type: Types.ObjectId })
    service_id: string;

    @Prop({ type: Number, default: 0 })
    value: number

    @Prop({ type: Number, enum: [0, 1], default: 0 })
    rating_type: number

    @Prop({ type: String, default: null })
    message: string

    created_at: string;
    updated_at: string;
}

export const RatingSchema = SchemaFactory.createForClass(Ratings);