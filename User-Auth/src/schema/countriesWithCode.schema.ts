import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: 'countries_with_codes' })
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
}

export const CountriesWithCodesSchema = SchemaFactory.createForClass(CountriesWithCodes)