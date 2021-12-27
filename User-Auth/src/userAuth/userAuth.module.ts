import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";

import { UserAuthController } from "./userAuth.controller";
import { UserAuthService } from "./userAuth.service";
import { ApiResponse } from "../utils/apiResponse.service";
import { UtilityService } from "../utils/utlity.service";
import { SendMail } from "../utils/sendMail.service";
import { ServiceProviderSchema } from "../schema/serviceProvider.schema";
import { CountriesWithCodeSchema } from "../schema/countriesWithCode.schema";
import { UserSchema } from "../schema/user.schema";
import { AdminSchema } from "../schema/admin.schema";
import { TempOtpSchema } from "../schema/tempOtp.schema";
import { ConnectedAccountSchema } from "../schema/connectedAccount.schema";

@Module({
    imports: [
        PassportModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' }
        }),
        MongooseModule.forFeature([
            { name: 'ServiceProvider', schema: ServiceProviderSchema },
            { name: 'User', schema: UserSchema },
            { name: 'Admin', schema: AdminSchema },
            { name: 'CountriesWithCodes', schema: CountriesWithCodeSchema },
            { name: 'ConnectedAccounts', schema: ConnectedAccountSchema },
            { name: 'TempOtp', schema: TempOtpSchema },
        ]),],
    controllers: [UserAuthController],
    providers: [UserAuthService, UtilityService, ApiResponse, SendMail]
})

export class UserAuthModule { } 