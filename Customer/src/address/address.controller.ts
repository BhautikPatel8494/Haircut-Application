import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from 'express'
import { CurrentUser } from "../authentication/guard/user.decorator";
import { CurrentUserDto } from "../home/dto/currentUser";
import { AddressService } from "./address.service";

@Controller('api')
export class AddressController {
    constructor(private addressService: AddressService) { }

    @Post('add-location')
    async addLocation(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.addressService.addLocation(user, req, res)
    }

    @Get('list-addresses')
    async listAddresses(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
        return await this.addressService.listAddresses(user, res);
    }

    @Post('delete-address')
    async deleteAddress(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.addressService.deleteAddress(user, req, res);
    }

    @Post('activate-address')
    async activateAddress(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.addressService.activateAddress(user, req, res);
    }
}