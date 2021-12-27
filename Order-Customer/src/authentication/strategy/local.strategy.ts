import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';

import { JwtPayload } from '../dto/jwt.dto';
import { Users } from '../../schema/user.schema';
import { ServiceProviders } from '../../schema/serviceProvider.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel('User') private readonly userModel: Model<Users>,
    @InjectModel('ServiceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    let userInfo = {};
    userInfo = await this.userModel.findById(payload._id);
    if (!userInfo) {
      userInfo = await this.serviceProviderModel.findById(payload._id)
    }
    if (!userInfo) {
      throw new UnauthorizedException();
    }
    return userInfo;
  }
}
