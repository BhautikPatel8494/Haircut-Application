import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SendMail {
    constructor(private mailer: MailerService) { }

    async sendMail(from: string, to: string, subject: string, html: string) {
        return await this.mailer.sendMail({
            from: from,
            to: to,
            subject: subject,
            html: html
        })
    }
}