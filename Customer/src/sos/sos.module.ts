import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ContactSchema } from "../schema/contact.schema";
import { SosAlarmSchema } from "../schema/sosAlarm.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { SosController } from "./sos.controller";
import { SosService } from "./sos.service";

@Module({
    imports: [MongooseModule.forFeature([
        { name: 'SosAlarm', schema: SosAlarmSchema },
        { name: 'Contact', schema: ContactSchema },
    ])],
    controllers: [SosController],
    providers: [SosService, ApiResponse]
})

export class SosModule { }