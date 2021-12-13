import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

export type LocationModeltype = Locations & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Locations {
    @Prop({ type: String, required: true, unique: true })
    location_name: string;

    @Prop({ type: String, required: true })
    country: string;

    @Prop({ type: String, required: true })
    state: string;

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
}

export const LocationSchema = SchemaFactory.createForClass(Locations);