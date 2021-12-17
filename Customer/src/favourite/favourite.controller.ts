import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from 'express';

import { CurrentUser } from "../authentication/guard/user.decorator";
import { FavouriteService } from "./favourite.service";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { CreateFavouriteDto, RemoveStylistOrService } from "./favourite.dto";
import { FilterDto } from "../home/home.dto";

@Controller('api')
export class FavouriteController {
    constructor(private readonly favouriteService: FavouriteService) { }

    @Post('add-fav-service-stylist')
    async addFavServiceStylist(@Body() favouriteBody: CreateFavouriteDto, @Res() res: Response) {
        return await this.favouriteService.addFavServiceStylist(favouriteBody, res);
    }

    @Post('list-fav-services')
    async listFavServices(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.favouriteService.listFavServices(filterBody, res);
    }

    @Post('list-fav-stylist')
    async listFavStylist(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.favouriteService.listFavStylist(filterBody, res);
    }

    @Post('remove-fav-service-stylist')
    async removeFavServiceOrStylist(@CurrentUser() user: CurrentUserDto, @Body() favouriteBody: RemoveStylistOrService, @Res() res: Response) {
        return await this.favouriteService.removeFavServiceOrStylist(user, favouriteBody, res);
    }
}