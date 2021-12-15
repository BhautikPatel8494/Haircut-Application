import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from './authentication/authentication.module';
import { JwtAuthGuard } from './authentication/gaurd/jwt.auth.gaurd';
import { BookingOrderModule } from './bookingOrder/bookingOrder.module';
import { CartOrderModule } from './cartOrder/cartOrder.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URL,
      }),
    }),
    CartOrderModule,
    AuthenticationModule,
    BookingOrderModule
  ],
  providers:[{
    provide: APP_GUARD,
    useClass:JwtAuthGuard
  }]
})
export class MainModule {}
