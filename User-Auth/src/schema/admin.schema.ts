import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type adminType = Admin & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: "admin"})
export class Admin {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: String, default: null })
  profile: string;

  @Prop({ type: String, default: null })
  mobile_no: string;

  @Prop({ type: String, default: null })
  authy_id: string;

  created_at: string;
  updated_at: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
