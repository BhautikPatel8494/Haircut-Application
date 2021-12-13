import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type FavouriteModeltype = Favourite & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Favourite {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  user_id: String;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: '' })
  service_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: '' })
  stylist_id: String;

  @Prop({ type: Number, default: 0 })
  type: number;
}

export const FavouriteSchema = SchemaFactory.createForClass(Favourite);