import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type tempOtpType = TempOtp & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TempOtp {
  @Prop({ type: String })
  phone_number: string;

  @Prop({ type: String })
  otp: string;
}

export const TempOtpSchema = SchemaFactory.createForClass(TempOtp);
