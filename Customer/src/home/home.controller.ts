import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { Public } from "../authentication/guard/public.decorator";
import { CurrentUser } from "../authentication/guard/user.decorator";
import { CreateCustomerTransactionDto, FilterDto } from "./home.dto";
import { HomeService } from "./home.service";

@Controller('api')
export class HomeController {
    constructor(private readonly homeService: HomeService) { }

    @Post('category-list')
    async listCategories(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.listCategories(filterBody, res);
    }

    @Post('service-list')
    async serviceListing(@CurrentUser() user: CurrentUserDto, @Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.serviceListing(user, filterBody, res);
    }

    @Public()
    @Post('explore-services')
    async exploreService(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.exploreService(filterBody, res);
    }

    @Post('set-preference')
    async setPreference(@Body() preferenceBody: { user_id: string, preference: [] }, @Res() res: Response) {
        return await this.homeService.setPreference(preferenceBody, res);
    }

    @Post('search-stylist')
    async searchStylist(@CurrentUser() user: CurrentUserDto, @Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.searchStylist(user, filterBody, res);
    }

    @Post('show-all-active-stylist')
    async showAllActiveStylist(@CurrentUser() user: CurrentUserDto, @Req() filterBody: Request, @Res() res: Response) {
        return await this.homeService.showAllActiveStylist(user, filterBody, res);
    }

    @Post('get-all-active-stylist')
    async getAllActiveStylist(@CurrentUser() user: CurrentUserDto, @Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.getAllActiveStylist(user, filterBody, res)
    }

    @Post('stylist-detail')
    async stylistDetail(@CurrentUser() user: CurrentUserDto, @Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.stylistDetail(user, filterBody, res);
    }

    @Post('find-nearby-stylist')
    async findNearByStylist(@Body() filterBody: Request, @Res() res: Response) {
        return await this.homeService.findNearByStylist(filterBody, res)
    }

    @Post('stylist-availability')
    async stylistAvailability(@CurrentUser() user: CurrentUserDto, @Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.stylistAvailability(user, filterBody, res);
    }

    @Post('booking-detail')
    async bookingDetail(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.bookingDetail(filterBody, res);
    }

    @Get('transaction-listing')
    async transactionListing(@CurrentUser() user: CurrentUserDto, @Req() filterBody: Request, @Res() res: Response) {
        return await this.homeService.transactionListing(user, filterBody, res);
    }

    @Post('get-stylist-time-slots')
    async getStylistTimeSlots(@Body() filterBody: FilterDto, @Res() res: Response) {
        return await this.homeService.getStylistTimeSlots(filterBody, res);
    }

    @Get('get-admin-time-slots')
    async getAdminTimeSlots(@Res() res: Response) {
        return await this.homeService.getAdminTimeSlots(res);
    }

    @Get('payment-listing')
    async paymentListing(@CurrentUser() user: CurrentUserDto, @Req() filterBody: Request, @Res() res: Response) {
        return await this.homeService.paymentListing(user, filterBody, res);
    }

    // @Get('refund-to-card')
    // async refundToCard(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
    //     return await this.homeService.refundToCard(user, req, res);
    // }

    @Post('add-to-wallet')
    async addToWallet(@CurrentUser() user: CurrentUserDto, @Body() customerTransaction: CreateCustomerTransactionDto, @Res() res: Response) {
        return await this.homeService.addToWallet(user, customerTransaction, res)
    }
}