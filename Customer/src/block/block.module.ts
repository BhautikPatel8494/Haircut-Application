import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { BlockController } from "./block.controller";
import { BlockService } from "./block.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
    controllers: [BlockController],
    providers: [BlockService, ApiResponse]
})

export class BlockModule { }