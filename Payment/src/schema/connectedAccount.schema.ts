import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'connected_acounts' })
export class ConnectedAccounts {
    @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
    stylist_id: string;

    @Prop({ type: Object, required: true })
    stripe_data: any;

    created_at: string
    updated_at: string
}

export const ConnectedAccountSchema = SchemaFactory.createForClass(ConnectedAccounts)