import { Module } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { CountriesWithCodesSchema } from "src/schema/countriesWithCode.schema";
import { ServiceProviderSchema } from "src/schema/serviceProvider.schema";
import { ApiResponse } from "src/utils/apiResponse.service";
import { UtilityService } from "src/utils/utlity.service";
import { UsertAuthController } from "./userAuth.controller";
import { UserAuthService } from "./userAuth.service";
import { PassportModule } from "@nestjs/passport";
import { TempOtpSchema } from "src/schema/tempOtp.schema";
import { ConnectedAccountSchema } from "src/schema/connectedAccount.schema";
import { UserSchema } from "src/schema/user.schema";

@Module({
    imports: [
        PassportModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' }
        }),
        MongooseModule.forFeature([
            { name: 'serviceProvider', schema: ServiceProviderSchema },
            { name: 'countriesWithCodes', schema: CountriesWithCodesSchema },
            { name: 'tempOtp', schema: TempOtpSchema },
            { name: 'connectedAccounts', schema: ConnectedAccountSchema },
            { name: 'user', schema: UserSchema },
        ]),],
    controllers: [UsertAuthController],
    providers: [UserAuthService, UtilityService, ApiResponse],
})

export class UserAuthModule { } 