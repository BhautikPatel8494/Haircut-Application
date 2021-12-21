import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'stylist_transfers' })
export class StylistTransfers {
    @Prop({ type: Types.ObjectId, required: true })
    stylist_id: string;

    @Prop({ type: String, required: true })
    amount: string;

    @Prop({ type: String, default: null })
    transfer_id: string;

    @Prop({ type: String, required: true })
    stripe_account_id: string;

    created_at: string;
    updated_at: string;
}

export const StylistTransferSchema = SchemaFactory.createForClass(StylistTransfers);