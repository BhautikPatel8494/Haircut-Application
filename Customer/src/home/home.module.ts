import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Customer_CartSchema } from "../schema/cartModel.schema";
import { CategoriesSchema } from "../schema/categoryModel.schema";
import { Customer_TransactionSchema } from "../schema/customerTransaction.schema";
import { CustomServiceSchema } from "../schema/customService.schema";
import { FavouriteSchema } from "../schema/favouriteModel.schema";
import { ConfigSchema } from "../schema/globalSettings.schema";
import { LocationSchema } from "../schema/locationModel.schema";
import { OrderSchema } from "../schema/orderModel.schema";
import { ScheduleSchema } from "../schema/scheduleModel.schema";
import { ServiceSchema } from "../schema/serviceModel.schema";
import { Service_ProviderSchema } from "../schema/serviceProvider.schema";
import { UserSchema } from "../schema/userModel.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { Utility } from "../utils/utility.service";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";

@Module({
    imports: [MongooseModule.forFeature([
        { name: 'User', schema: UserSchema },
        { name: 'Service_Provider', schema: Service_ProviderSchema },
        { name: 'Customer_Cart', schema: Customer_CartSchema },
        { name: 'Order', schema: OrderSchema },
        { name: 'Customer_Transaction', schema: Customer_TransactionSchema },
        { name: 'Categories', schema: CategoriesSchema },
        { name: 'Service', schema: ServiceSchema },
        { name: 'Custom_Service', schema: CustomServiceSchema },
        { name: 'Favourite', schema: FavouriteSchema },
        { name: 'Locations', schema: LocationSchema },
        { name: 'Schedule', schema: ScheduleSchema },
        { name: 'Config', schema: ConfigSchema }
    ])],
    controllers: [HomeController],
    providers: [HomeService, ApiResponse, Utility],
})

export class HomeModule { }