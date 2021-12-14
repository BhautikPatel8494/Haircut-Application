import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CustomerCartSchema } from "../schema/customerCart.schema";
import { CategoriesSchema } from "../schema/categories.schema";
import { CustomerTransactionSchema } from "../schema/customerTransaction.schema";
import { CustomServiceSchema } from "../schema/customService.schema";
import { FavouriteSchema } from "../schema/favourite.schema";
import { ConfigSchema } from "../schema/config.schema";
import { LocationSchema } from "../schema/location.schema";
import { OrderSchema } from "../schema/order.schema";
import { ScheduleSchema } from "../schema/schedule.schema";
import { ServiceSchema } from "../schema/service.schema";
import { ServiceProviderSchema } from "../schema/serviceProvider.schema";
import { UserSchema } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { Utility } from "../utils/utility.service";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";

@Module({
    imports: [MongooseModule.forFeature([
        { name: 'User', schema: UserSchema },
        { name: 'ServiceProvider', schema: ServiceProviderSchema },
        { name: 'CustomerCart', schema: CustomerCartSchema },
        { name: 'Order', schema: OrderSchema },
        { name: 'CustomerTransaction', schema: CustomerTransactionSchema },
        { name: 'Categories', schema: CategoriesSchema },
        { name: 'Service', schema: ServiceSchema },
        { name: 'CustomService', schema: CustomServiceSchema },
        { name: 'Favourite', schema: FavouriteSchema },
        { name: 'Locations', schema: LocationSchema },
        { name: 'Schedule', schema: ScheduleSchema },
        { name: 'Config', schema: ConfigSchema }
    ])],
    controllers: [HomeController],
    providers: [HomeService, ApiResponse, Utility],
})

export class HomeModule { }