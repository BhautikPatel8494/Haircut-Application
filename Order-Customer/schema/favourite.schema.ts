import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'favourites' })
export class Favourites {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  user_id: String;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: '' })
  service_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: '' })
  stylist_id: String;

  @Prop({ type: Number, default: 0 })
  type: number;

  created_at: string;
  updated_at: string;
}

export const FavouriteSchema = SchemaFactory.createForClass(Favourites);