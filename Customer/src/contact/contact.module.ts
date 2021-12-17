import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";
import { ContactSchema } from "../schema/contact.schema";
import { ApiResponse } from "../utils/apiResponse.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: 'Contact', schema: ContactSchema }])],
    controllers: [ContactController],
    providers: [ContactService, ApiResponse]
})

export class ContactModule { }