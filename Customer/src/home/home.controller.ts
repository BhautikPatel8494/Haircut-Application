import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { Public } from "../authentication/guard/public.decorator";
import { CurrentUser } from "../authentication/guard/user.decorator";
import { CurrentUserDto } from "./dto/currentUser";
import { HomeService } from "./home.service";

@Controller('api')
export class HomeController {
    constructor(private readonly homeService: HomeService) { }

    @Post('category-list')
    async listCategories(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.listCategories(req, res);
    }

    @Post('service-list')
    async serviceListing(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.serviceListing(user, req, res);
    }

    @Public()
    @Post('explore-services')
    async exploreService(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.exploreService(req, res);
    }

    @Post('set-preference')
    async setPreference(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.setPreference(req, res);
    }

    @Post('search-stylist')
    async searchStylist(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.searchStylist(user, req, res);
    }

    @Post('show-all-active-stylist')
    async showAllActiveStylist(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.showAllActiveStylist(user, req, res);
    }

    @Post('get-all-active-stylist')
    async getAllActiveStylist(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.getAllActiveStylist(user, req, res)
    }

    @Post('stylist-detail')
    async stylistDetail(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.stylistDetail(user, req, res);
    }

    @Post('find-nearby-stylist')
    async findNearByStylist(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.findNearByStylist(req, res)
    }

    @Post('stylist-availability')
    async stylistAvailability(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.stylistAvailability(user, req, res);
    }

    @Post('booking-detail')
    async bookingDetail(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.bookingDetail(req, res);
    }

    @Get('transaction-listing')
    async transactionListing(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.transactionListing(user, req, res);
    }

    @Post('get-stylist-time-slots')
    async getStylistTimeSlots(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.getStylistTimeSlots(req, res);
    }

    @Get('get-admin-time-slots')
    async getAdminTimeSlots(@Req() req: Request, @Res() res: Response) {
        return await this.homeService.getAdminTimeSlots(req, res);
    }

    @Get('payment-listing')
    async paymentListing(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.paymentListing(user, req, res);
    }

    @Post('add-to-wallet')
    async addToWallet(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.homeService.addToWallet(user, req, res)
    }
}