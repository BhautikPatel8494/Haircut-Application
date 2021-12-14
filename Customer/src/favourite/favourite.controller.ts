import { Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from 'express';
import { CurrentUser } from "../authentication/guard/user.decorator";
import { CurrentUserDto } from "../home/dto/currentUser";
import { FavouriteService } from "./favourite.service";

@Controller('api')
export class FavouriteController {
    constructor(private readonly favouriteService: FavouriteService) { }

    @Post('add-fav-service-stylist')
    async addFavServiceStylist(@Req() req: Request, @Res() res: Response) {
        return await this.favouriteService.addFavServiceStylist(req, res);
    }

    @Post('list-fav-services')
    async listFavServices(@Req() req: Request, @Res() res: Response) {
        return await this.favouriteService.listFavServices(req, res);
    }

    @Post('list-fav-stylist')
    async listFavStylist(@Req() req: Request, @Res() res: Response) {
        return await this.favouriteService.listFavStylist(req, res);
    }

    @Post('remove-fav-service-stylist')
    async removeFavServiceOrStylist(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.favouriteService.removeFavServiceOrStylist(user, req, res);
    }
}