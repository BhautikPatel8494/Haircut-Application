import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'favourites' })
export class Favourites {
  @Prop({ type: Types.ObjectId, required: true })
  user_id: string;

  @Prop({ type: Types.ObjectId, default: '' })
  service_id: string;

  @Prop({ type: Types.ObjectId, default: '' })
  stylist_id: string;

  @Prop({ type: Number, default: 0 })
  type: number;

  created_at: string;
  updated_at: string;
}

export const FavouriteSchema = SchemaFactory.createForClass(Favourites);