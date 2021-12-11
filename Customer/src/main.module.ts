import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { config } from 'dotenv';

import { JwtAuthGuard } from './authentication/guard/jwt.auth.gaurd';
import { HomeModule } from './home/home.module';
import { AuthenticationModule } from './authentication/authentication.module';
config()

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URL,
      }),
    }),
    HomeModule,
    AuthenticationModule
  ],
  providers: [{
    provide: APP_GUARD,
    useClass: JwtAuthGuard
  }],
})
export class MainModule { }
