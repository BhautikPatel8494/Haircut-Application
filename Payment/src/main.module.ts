import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { config } from 'dotenv';

import { AuthenticationModule } from './authentication/authentication.module';
import { PaymentModule } from './payment/payment.module';
import { JwtAuthGuard } from './authentication/guard/jwt.auth.gaurd';
config()

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRootAsync({
            useFactory: () => ({
                uri: process.env.MONGODB_URL,
            }),
        }),
        AuthenticationModule,
        PaymentModule,
    ],
    providers: [{
        provide: APP_GUARD,
        useClass: JwtAuthGuard
    }],
})
export class MainModule { }
