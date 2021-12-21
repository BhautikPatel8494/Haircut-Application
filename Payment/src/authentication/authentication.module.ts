import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from '@nestjs/jwt';

import { UserSchema } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { JwtStrategy } from "./strategy/local.strategy";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
        ]),
        PassportModule.register({ defaultStrategy: 'jwt', session: false }),
        JwtModule.registerAsync({
            useFactory: () => {
                return {
                    secret: process.env.JWT_SECRET,
                    signOptions: { expiresIn: '24h' },
                };
            },
        }),
    ],
    providers: [JwtStrategy, ApiResponse],
})

export class AuthenticationModule { }