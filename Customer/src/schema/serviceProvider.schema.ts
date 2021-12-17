import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'service_providers' })
export class ServiceProviders {

  @Prop({ type: String, required: true })
  firstname: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, default: null })
  middlename: string;

  @Prop({ type: String, required: true })
  full_name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, default: null })
  profile: string;

  @Prop({ type: String, required: true })
  country_code: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String, required: true })
  phone_number: string;

  @Prop({ type: String, enum: ['men', 'women', 'other'], required: true })
  gender: string;

  @Prop({ type: String, default: null })
  otp: string;

  @Prop({ type: Date, default: null })
  dob: Date;

  @Prop({ type: Number, default: 0 })
  wallet: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'categories',
    required: true,
  })
  category: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'categories.specialization',
    required: true,
  })
  specialization: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['junior', 'senior', 'advanced'],
    required: true,
  })
  experience: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Boolean, default: false })
  is_signing_completed: boolean;

  @Prop({ type: Boolean, default: false })
  is_bank_linked: boolean;

  @Prop({ type: Boolean, default: false })
  is_personalized_completed: boolean;

  @Prop({ type: Boolean, default: false })
  is_workpreference_complete: boolean;

  @Prop({ type: Boolean, default: false })
  learn_to_use_app: boolean;

  @Prop({ type: String, default: null })
  city: string;

  @Prop({ type: String, default: null })
  state: string;

  @Prop({ type: String, default: null })
  zip_code: string;

  @Prop({ type: String, default: null })
  ssn_number: string;

  @Prop({ type: String, default: null })
  cosmetology_license: string;

  @Prop({ type: String, default: null })
  cosmetology_license_image: string;

  @Prop({ type: String, default: null })
  driving_license: string;

  @Prop({ type: String, default: null })
  driving_license_image: string;

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  contractor: number;

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  liability_waiver: number;

  @Prop({ type: String })
  liability_waiver_image: string;

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  privacy_policy: number;

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  terms_condition: number;

  @Prop({ type: Number, enum: [0, 1], default: 1 })
  online: number;

  @Prop({ type: Number, default: 5 })
  radius: number;

  @Prop({ type: Array, default: [] })
  order_type: [];

  @Prop({ type: Array, default: [] })
  preferences: [];

  @Prop({ type: Number, default: 0 })
  lat: number;

  @Prop({ type: Number, default: 0 })
  lng: number;

  @Prop({ type: Array, default: [] })
  blocked_customer: [type: string];

  @Prop({ type: Date, default: null })
  order_accepted_at: Date

  @Prop({ type: Date, default: null })
  reached_location_at: Date

  @Prop({ type: Date, default: null })
  started_service_at: Date

  @Prop({ type: Date, default: null })
  completed_at: Date

  @Prop({ type: String })
  customer_referral_code: string;

  @Prop({ type: String })
  stylist_referral_code: string;

  @Prop({ type: Object })
  register_location: {
    type: string;
    coordinates: []
  };

  @Prop({ type: Object })
  live_location: {
    type: string;
    coordinates: [];
  };

  @Prop({ type: Array, default: [] })
  devices: [];

  @Prop({ type: Number, enum: [0, 1], default: 0 })
  is_mobile_verified: number;

  @Prop({ type: String, default: null })
  about: string;

  @Prop({ type: Array, default: [] })
  languages: [];

  @Prop({ type: Array, default: [] })
  skills: [];

  @Prop({ type: Array, default: [] })
  portfolio_images: [];

  @Prop({ type: String, default: null })
  contract: string;

  @Prop({ type: Boolean, default: false })
  contract_signed: boolean;

  @Prop({ type: Boolean, default: false })
  is_stylist_onboarding_complete: boolean;

  @Prop({
    type: String,
    enum: [
      'awaiting',
      'rejected',
      'accepted',
    ],
    default: 'awaiting',
  })
  registration_status: string;

  @Prop({ type: Boolean, default: false })
  is_first_login: boolean;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Array, default: [] })
  portfolio_videos: [];

  @Prop({ type: String, default: 'basic' })
  active_schedule_type: string;
}

const UpdatedSchema = SchemaFactory.createForClass(ServiceProviders);
UpdatedSchema.index({ live_location: '2dsphere' })
UpdatedSchema.index({ register_location: '2dsphere' })

export const ServiceProviderSchema = UpdatedSchema