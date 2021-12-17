import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RatingController } from "./rating.controller";
import { RatingService } from "./rating.service";
import { RatingSchema } from "../schema/rating.schema";
import { ApiResponse } from "../utils/apiResponse.service";

@Module({
    imports: [MongooseModule.forFeature([
        { name: 'Rating', schema: RatingSchema }
    ])],
    controllers: [RatingController],
    providers: [RatingService, ApiResponse]
})
export class RatingModule { }