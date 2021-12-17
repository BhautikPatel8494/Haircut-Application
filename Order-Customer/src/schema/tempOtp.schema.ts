import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'temp_otps' })
export class TempOtps {
  @Prop({ type: String })
  phone_number: string;

  @Prop({ type: String })
  otp: string;

  created_at: string;
  updated_at: string;
}

export const TempOtpSchema = SchemaFactory.createForClass(TempOtps);
