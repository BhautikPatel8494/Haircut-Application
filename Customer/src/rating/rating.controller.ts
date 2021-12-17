import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";

import { RatingService } from "./rating.service";
import { FilterDto } from "../home/home.dto";
import { CreateRatingDto } from "./rating.dto";

@Controller('api')
export class RatingController {
    constructor(private readonly ratingService: RatingService) { }

    @Post('stylist-rating')
    async stylistRating(@Body() rating: CreateRatingDto, @Res() res: Response) {
        return await this.ratingService.stylistRating(rating, res);
    }

    @Post('custom-service-rating')
    async customServiceRating(@Body() rating: CreateRatingDto, @Res() res: Response) {
        return await this.ratingService.customServiceRating(rating, res);
    }

    @Post('service-rating')
    async serviceRating(@Body() rating: CreateRatingDto, @Res() res: Response) {
        return await this.ratingService.serviceRating(rating, res);
    }

    @Post('list-stylist-rating')
    async listStylistRating(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.ratingService.listStylistRating(filterBody, res);
    }

    @Post('list-service-rating')
    async listServiceRating(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.ratingService.listServiceRating(filterBody, res);
    }

}