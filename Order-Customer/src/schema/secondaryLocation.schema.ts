import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'secondary_locations' })
export class SecondaryLocations {
    @Prop({
        type: Types.ObjectId,
        ref: 'locations',
        required: true,
    })
    parent_location_id: string;

    @Prop({ type: String, required: true })
    location_name: string;

    @Prop({ type: String, enum: ['input_address', 'select_location', 'draw_on_map'], required: true })
    location_type: string;

    @Prop({ type: String })
    address_1: string;

    @Prop({ type: String })
    address_2: string;

    @Prop({ type: String })
    city: string;

    @Prop({ type: String })
    zip_code: string;

    @Prop({ type: String })
    country: string;

    @Prop({ type: String })
    state: string;

    @Prop({ type: String })
    input_address: string;

    @Prop({ type: Number, default: 5 })
    radius: number;

    @Prop({ type: String, required: true })
    lat: string;

    @Prop({ type: String, required: true })
    lng: string;

    @Prop({ type: Object })
    location: {
        type: string,
        coordinates: []
    };

    @Prop({ type: Boolean, default: false })
    status: boolean;

    @Prop({ type: Boolean, default: false })
    deleted: boolean;

    created_at: string;
    updated_at: string;
}

export const SecondaryLocationSchema = SchemaFactory.createForClass(SecondaryLocations);
