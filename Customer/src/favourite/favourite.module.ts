import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FavouriteSchema } from "../schema/favourite.schema";
import { ScheduleSchema } from "../schema/schedule.schema";
import { UserSchema } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { FavouriteController } from "./favourite.controller";
import { FavouriteService } from "./favourite.service";

@Module({
    imports: [MongooseModule.forFeature([
        { name: "User", schema: UserSchema },
        { name: "Favourite", schema: FavouriteSchema },
        { name: "Schedule", schema: ScheduleSchema }
    ])],
    controllers: [FavouriteController],
    providers: [FavouriteService, ApiResponse]
})

export class FavouriteModule { }