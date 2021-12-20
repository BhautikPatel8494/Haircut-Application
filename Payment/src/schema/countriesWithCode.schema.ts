import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'connected_acounts' })
export class CountriesWithCodes {
    @Prop({ type: String })
    code: string;

    @Prop({ type: String })
    dial_code: string

    @Prop({ type: String })
    currency_name: string

    @Prop({ type: String })
    currency_symbol: string

    @Prop({ type: String })
    currency_code: string

    @Prop({ type: Number })
    withdrawl_fee: number

    @Prop({ type: Number })
    deposit: number;

    @Prop({ type: String })
    name: string

    created_at: string;
    updated_at: string;
}

export const CountriesWithCodeSchema = SchemaFactory.createForClass(CountriesWithCodes)