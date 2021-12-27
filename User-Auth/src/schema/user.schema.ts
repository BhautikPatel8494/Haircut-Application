import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class FamilyMembers {
  _id?: string;

  @Prop({ type: String, required: true })
  firstname: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, default: null })
  profile: any;

  @Prop({ type: String, required: true })
  dob: string;

  @Prop({
    type: String,
    enum: ['daughter', 'son', 'father', 'mother', 'wife', 'husband'],
    required: true,
  })
  relation: string;

  @Prop({ type: String, enum: ['men', 'women', 'kids', 'senior'] })
  user_type: string;

  @Prop({ type: Boolean, default: false })
  default_profile?: boolean;

  created_at?: string
  updated_at?: string
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
  location: {
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
  @Prop({ type: Types.ObjectId })
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
class Cards {
  @Prop({ type: String, default: null })
  type: string;

  @Prop({ type: String, default: null })
  lastd: string;

  @Prop({ type: String, default: null })
  customerId: string;

  @Prop({ type: String, default: null })
  exp_month: string;

  @Prop({ type: String, default: null })
  exp_year: string;

  @Prop({ type: String, default: null })
  account_holder_name: string;

  @Prop({ type: String, default: null })
  zip_code: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  created_at: string;
  updated_at: string;
}

const CardSchema = SchemaFactory.createForClass(Cards);

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

  @Prop({ type: String })
  dob: string;

  @Prop({ type: Array, default: [] })
  preference: [];

  @Prop({ type: Boolean, default: true })
  default_profile: boolean;

  @Prop({
    type: String,
    enum: ['men', 'women', 'kids', 'senior'],
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

  @Prop({ type: [CardSchema], default: [] })
  cards: [Cards];

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: Array, default: [] })
  devices: [{
    type: string;
    token: string;
  }];

  @Prop({ type: String, default: null })
  access_token: string;

  created_at: string
  updated_at: string
}

export const UserSchema = SchemaFactory.createForClass(Users);
