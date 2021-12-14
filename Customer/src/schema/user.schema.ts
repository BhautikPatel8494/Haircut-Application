import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
class FamilyMembers {
  _id: string;

  @Prop({ type: String, required: true })
  firstname: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, default: null })
  profile: string;

  @Prop({ type: Date, required: true })
  dob: Date;

  @Prop({
    type: String,
    enum: ['daughter', 'son', 'father', 'mother', 'wife', 'husband'],
    required: true,
  })
  relation: string;

  @Prop({ type: String, enum: ['men', 'women', 'kid', 'senior'] })
  user_type: string;

  @Prop({ type: Boolean, default: false })
  default_profile: boolean;

  created_at: string
  updated_at: string
}

const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMembers);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Addresses {
  _id: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String, default: null })
  title: string;

  @Prop({ type: String, default: 'home' })
  address_type: string;

  @Prop({ type: String, required: true })
  lat: string;

  @Prop({ type: String, required: true })
  lng: string;


  @Prop({ type: Object })
  live_location: {
    type: string;
    coordinates: []
  };

  @Prop({ type: String, default: null })
  country: string

  @Prop({ type: String, default: null })
  country_code: string

  @Prop({ type: String, default: null })
  state: string

  @Prop({ type: String, default: null })
  city: string;

  @Prop({ type: String, default: null })
  zip_code: string;

  @Prop({ type: Boolean, default: false })
  active: boolean;
}

const AddressSchema = SchemaFactory.createForClass(Addresses);

@Schema()
class BlockStylists {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  stylist_id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, enum: ['inactive', 'active'], default: 'active' })
  block_status: string;

  @Prop({ type: String })
  experience: string;
}

const BlockStylistSchema = SchemaFactory.createForClass(BlockStylists);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Users {
  @Prop({ type: String, required: true })
  firstname: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, required: true })
  middlename: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, default: null })
  profile: string;

  @Prop({ type: String, required: true })
  country_code: string;

  @Prop({ type: String, required: true })
  phone_number: string;

  @Prop({ type: String, default: null })
  otp: string;

  @Prop({ type: String, enum: ['men', 'women', 'other'], required: true })
  gender: string;

  @Prop({ type: Date })
  dob: Date;

  @Prop({ type: Object })
  register_location: {
    type: string;
    coordinates: []
  };

  @Prop({ type: Array, default: [] })
  preference: [];

  @Prop({ type: Boolean, default: true })
  default_profile: boolean;

  @Prop({
    type: String,
    enum: ['men', 'women', 'kid', 'senior'],
    required: true,
  })
  user_type: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: [Addresses];

  @Prop({ type: [FamilyMemberSchema], default: [] })
  family_members: [FamilyMembers];

  @Prop({ type: Number, default: 0 })
  number_of_bookings: number;

  @Prop({ type: Number, default: 0 })
  wallet_balance: number;

  @Prop({ type: [BlockStylistSchema], default: [] })
  blocked_stylist: [BlockStylists];

  @Prop()
  cards: [
    {
      type: { type: string };
      logo: { type: string };
      lastd: { type: string };
      customerId: { type: string };
      exp_month: { type: string };
      exp_year: { type: string };
      account_holder_name: { type: string };
      zip_code: { type: string };
      isDefault: { type: boolean; default: false };
      createdAt: { type: Date };
      updatedAt: { type: Date };
    },
  ];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Array, default: [] })
  devices: [];

  created_at: string
  updated_at: string
}

export const UserSchema = SchemaFactory.createForClass(Users);
