import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from "@nestjs/passport";

import { UserSchema } from "../schema/user.schema";
import { JwtStrategy } from "./strategy/local.strategy";
import { Utility } from "../utils/utility.service";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import { ApiResponse } from "../utils/apiResponse.service";
import { OrderSchema } from "../schema/order.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            { name: 'Order', schema: OrderSchema }
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
    controllers: [AuthenticationController],
    providers: [AuthenticationService, JwtStrategy, ApiResponse, Utility],
})

export class AuthenticationModule { }