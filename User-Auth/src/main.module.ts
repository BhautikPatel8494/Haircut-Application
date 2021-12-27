import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { UserAuthModule } from "./userAuth/userAuth.module";

@Module({
    imports: [
        ConfigModule.forRoot(),
        MailerModule.forRoot({
            transport: {
                host: process.env.EMAIL_SMTP_HOST,
                port: process.env.EMAIL_SMTP_PORT,
                ignoreTLS: false,
                secure: false,
                auth: {
                    user: process.env.EMAIL_SMTP_USERNAME,
                    pass: process.env.EMAIL_SMTP_PASSWORD,
                },
            },
            defaults: {
                from: process.env.EMAIL_SMTP_USERNAME,
            },
        }),
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