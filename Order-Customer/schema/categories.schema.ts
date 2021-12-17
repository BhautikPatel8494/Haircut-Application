import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'categories' })
export class Categories {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  permalink: string;

  @Prop({ type: String })
  featured_image: string;

  @Prop({ type: String })
  section_image: string;

  @Prop({ type: String })
  seo_title: string;

  @Prop({ type: String })
  seo_description: string;

  @Prop({ type: Boolean, default: false })
  index: boolean;

  @Prop({ type: Boolean, default: false })
  no_index: Boolean;

  @Prop({ type: Boolean, default: false })
  follow: boolean;

  @Prop({ type: Boolean, default: false })
  no_follow: boolean;

  @Prop({ type: String })
  canonical_url: string

  @Prop({ type: Object })
  sub_categories: object

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  deleted: string;
}

export const CategoriesSchema = SchemaFactory.createForClass(Categories);