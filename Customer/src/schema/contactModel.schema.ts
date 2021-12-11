import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type ContactModeltype = Contact & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Contact {
    @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
    user_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, enum: ['stylist', 'customer'], default: 'customer' })
    type: string;

    @Prop({ type: String, required: true })
    name: string

    @Prop({ type: Number, required: true })
    phone_number: number

    @Prop({ type: Boolean, default: true })
    status: boolean
}

export const ContactSchema = SchemaFactory.createForClass(Contact);