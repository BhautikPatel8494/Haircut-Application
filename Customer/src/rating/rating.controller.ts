import { Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { RatingService } from "./rating.service";

@Controller('api')
export class RatingController {
    constructor(private readonly ratingService: RatingService) { }

    @Post('stylist-rating')
    async stylistRating(@Req() req: Request, @Res() res: Response) {
        return await this.ratingService.stylistRating(req, res);
    }

    @Post('list-stylist-rating')
    async listStylistRating(@Req() req: Request, @Res() res: Response) {
        return await this.ratingService.listStylistRating(req, res);
    }

    // @Post('list-service-rating')
    // async listServiceRating(@Req() req: Request, @Res() res: Response) {
    //     return await this.ratingService.listServiceRating(req, res);
    // }
}