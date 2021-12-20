import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { UserAuthModule } from "./userAuth/userAuth.module";

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRootAsync({
            useFactory: () => ({
                uri: process.env.MONGODB_URL,
            }),
        }),
        UserAuthModule],
    providers: [],
    controllers: [],
})

export class MainModule { }