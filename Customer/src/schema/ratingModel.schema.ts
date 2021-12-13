import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type ContactModeltype = ContactModel & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ContactModel {
    @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
    user_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    stylist_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    custom_service_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    order_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, enum: ['On-Demand', 'Regular'] })
    order_type: string;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    service_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    value: number

    @Prop({ type: Number, enum: [0, 1], default: 0 })
    rating_type: number

    @Prop({ type: String, default: null })
    message: string
}

export const ContactSchema = SchemaFactory.createForClass(ContactModel);